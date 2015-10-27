package acceptance

import java.net.URL
import java.util.concurrent.TimeUnit

import acceptance.Config.appUrl
import configuration.QA.{passthroughCookie => qaCookie}
import org.openqa.selenium.support.ui.{ExpectedConditions, WebDriverWait}
import org.openqa.selenium.{By, Cookie, WebDriver}
import org.scalatest.selenium.WebBrowser

import scala.collection.JavaConverters._
import scala.util.Try

trait Util { this: WebBrowser =>
  implicit val driver: WebDriver

  protected def withQACookie(block: => Unit): Unit = {
    val cookie = new Cookie(qaCookie.name, qaCookie.value)
    go.to(appUrl)
    driver.manage().addCookie(cookie)

    try block finally {
      driver.manage().deleteCookie(cookie)
    }
  }

  def resetDriver() = {
    driver.get("about:about")
    go.to(appUrl)
    driver.manage().deleteAllCookies()
    driver.manage().timeouts().implicitlyWait(60, TimeUnit.SECONDS)
  }

  private val defaultTimeOut = 60

  protected def pageHasText(text: String, timeoutSecs: Int=defaultTimeOut): Boolean = {
    val pred = ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), text)
    new WebDriverWait(driver, timeoutSecs).until(pred)
  }

  protected def pageHasElement(q: Query, timeoutSecs: Int=defaultTimeOut): Boolean = {
    val pred = ExpectedConditions.visibilityOfElementLocated(q.by)
    Try {
      new WebDriverWait(driver, timeoutSecs).until(pred)
    }.isSuccess
  }

  protected def currentHost: String = new URL(currentUrl).getHost

  def cookiesSet: Set[Cookie] = driver.manage().getCookies.asScala.toSet
}

object TestUser {
  import com.gu.identity.testing.usernames.TestUsernames
  import com.github.nscala_time.time.Imports._

  private val testUsers = TestUsernames(
    com.gu.identity.testing.usernames.Encoder.withSecret(Config.testUsersSecret),
    recency = 2.days.standardDuration
  )
  val specialString = testUsers.generate()
}
