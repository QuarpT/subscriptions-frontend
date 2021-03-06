package controllers

import javax.inject.Inject

import com.gu.googleauth.GoogleAuthFilters.LOGIN_ORIGIN_KEY
 import actions.OAuthActions
import com.gu.googleauth.{GoogleAuth, UserIdentity}
import configuration.Config
import model.FlashMessage
import play.api.Play.current
import play.api.libs.json.Json
import play.api.mvc._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.ws.WSClient

import scala.concurrent.Future

class OAuth @Inject()(val wsClient: WSClient) extends Controller with OAuthActions{
  val ANTI_FORGERY_KEY = "antiForgeryToken"
  implicit val iWsClient = wsClient
  def login = NoCacheAction { request =>
    val flashMsgOpt = request.flash.get("error").map(FlashMessage.error)
    Ok(views.html.staff.unauthorised(flashMsgOpt))
  }


  /**
   * Redirect to Google with anti forgery token (that we keep in session storage - note that flashing is NOT secure)
   */
  def loginAction = Action.async { implicit request =>
    implicit val iWsClient = wsClient
    val antiForgeryToken = GoogleAuth.generateAntiForgeryToken()
    GoogleAuth.redirectToGoogle(Config.googleAuthConfig, antiForgeryToken)
      .map(_.withSession(request.session + (ANTI_FORGERY_KEY -> antiForgeryToken)))
  }

  /**
   * User comes back from Google.
   * We must ensure we have the anti forgery token from the loginAction call and pass this into a verification call which
   * will return a Future[UserIdentity] if the authentication is successful. If unsuccessful then the Future will fail.
   */
  def oauth2Callback = Action.async { implicit request =>
    val session = request.session
    session.get(ANTI_FORGERY_KEY) match {
      case None =>
        Future.successful(Redirect(routes.OAuth.login()).flashing("error" -> "Anti forgery token missing in session"))
      case Some(token) =>
        GoogleAuth.validatedUserIdentity(Config.googleAuthConfig, token).map { identity =>
          // We store the URL a user was trying to get to in the LOGIN_ORIGIN_KEY in AuthAction
          // Redirect a user back there now if it exists
          val redirect = session.get(LOGIN_ORIGIN_KEY) match {
            case Some(url) => Redirect(url)
            case None => Redirect(routes.Homepage.index())
          }
          // Store the JSON representation of the identity in the session - this is checked by AuthAction later
          redirect.withSession {
            session + (UserIdentity.KEY -> Json.toJson(identity).toString) - ANTI_FORGERY_KEY - LOGIN_ORIGIN_KEY
          }

        } recover {
          case t =>
            // you might want to record login failures here - we just redirect to the login page
            redirectWithError(session, s"Login failure: ${t.toString}")
        }
    }
  }

  private def redirectWithError(session: Session, errorMessage: String) =
    Redirect(routes.OAuth.login())
      .withSession(session - ANTI_FORGERY_KEY)
      .flashing("error" -> errorMessage)
}
