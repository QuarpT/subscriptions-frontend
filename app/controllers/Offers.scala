package controllers

import actions.CommonActions
 import com.gu.i18n.CountryGroup
import model.DigitalEdition.{INT, UK, getById}
import play.api.mvc.Controller
import utils.RequestCountry._

class Offers extends Controller with CommonActions {

  def offers = NoCacheAction { implicit request =>
    val countryGroup = request.getFastlyCountryGroup.getOrElse(CountryGroup.UK)
    val digitalEdition = getById(countryGroup.id).getOrElse(INT)
    Redirect(routes.Offers.offersPage(digitalEdition.id).url, request.queryString, SEE_OTHER)
  }

  def offersPage(edition: String) = NoCacheAction {
    getById(edition) map {
      case UK => Ok(views.html.offers.offers_uk())
      case digitalEdition => Ok(views.html.offers.offers_international(digitalEdition))
    } getOrElse {
      NotFound(views.html.error404())
    }
  }
}
