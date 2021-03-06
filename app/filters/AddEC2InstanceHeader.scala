package filters

import javax.inject.Inject

import akka.stream.Materializer
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.ws.WS
import play.api.mvc._

import scala.concurrent.Future

class AddEC2InstanceHeader @Inject()(implicit val mat: Materializer) extends Filter {

  // http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html
  lazy val instanceIdOptF = WS.url("http://169.254.169.254/latest/meta-data/instance-id").get().map(resp => Some(resp.body).filter(_.nonEmpty)).recover { case _ => None }

  def apply(nextFilter: RequestHeader => Future[Result])(requestHeader: RequestHeader): Future[Result] = for {
    result <- nextFilter(requestHeader)
    instanceIdOpt <- instanceIdOptF
  } yield instanceIdOpt.fold(result)(instanceId => result.withHeaders("X-EC2-instance-id" -> instanceId))

}
