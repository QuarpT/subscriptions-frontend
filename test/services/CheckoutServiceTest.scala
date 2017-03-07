package services
import com.gu.memsub.Benefit._
import com.gu.memsub.Product.{Delivery, ZDigipack}
import com.gu.memsub.Subscription.{ProductRatePlanChargeId, ProductRatePlanId}
import com.gu.memsub._
import com.gu.memsub.subsv2._
import model.{DigipackData, PaperData}
import org.joda.time.{Days, LocalDate}
import org.specs2.mutable.Specification
import touchpoint.ZuoraProperties

class CheckoutServiceTest extends Specification {

  implicit val today = new LocalDate("2016-07-22") // deterministic
  val address = Address("123 Fake St", "", "Town", "Kent", "123", "Blah")
  val noPricing = PricingSummary(Map.empty)

  val paperPlan = new CatalogPlan[Delivery, PaperCharges, Current](
    id = ProductRatePlanId("p"),
    name = "name",
    description = "desc",
    charges = PaperCharges(Map(MondayPaper -> PricingSummary(Map.empty)), None),
    product = Delivery,
    saving = None,
    s = Status.current
  )

  val digiPlan = new CatalogPlan[ZDigipack, PaidCharge[Digipack.type, BillingPeriod], Current](
    id = ProductRatePlanId("p"),
    name = "name",
    description = "desc",
    charges = PaidCharge(Digipack, BillingPeriod.Month, PricingSummary(Map.empty), ProductRatePlanChargeId("foo")),
    product = Product.Digipack,
    saving = None,
    s = Status.current
  )

  val zuora = ZuoraProperties(defaultDigitalPackFreeTrialPeriod = Days.days(14), gracePeriodInDays = Days.days(2))
  val paperData = Left(PaperData(new LocalDate("2016-07-30"), address, None, paperPlan))
  val digipackData = Right(DigipackData(digiPlan))

  "Free trial calculator" should {

    "Return the zuora payment delay + the grace period for a digipack sub" in {
      CheckoutService.paymentDelay(digipackData, zuora) mustEqual Days.days(16)
    }

    "Return the days between today and the start date for paper" in {
      CheckoutService.paymentDelay(paperData, zuora) mustEqual Days.days(8)
    }
  }

  "determineFirstAvailablePaperDate" should {

//    "Calculate the next available Friday correctly (if today is a Monday)" in {
//       CheckoutService.determineFirstAvailablePaperDate(new LocalDate("2017-03-06")) mustEqual(new LocalDate("2017-03-17"))
//    }

    "Calculate the next available Friday correctly (if today is a Friday)" in {
      CheckoutService.determineFirstAvailablePaperDate(new LocalDate("2017-03-10")) mustEqual(new LocalDate("2017-03-24"))
    }

    "Calculate the next available Friday correctly (if today is a Sunday)" in {
      CheckoutService.determineFirstAvailablePaperDate(new LocalDate("2017-03-12")) mustEqual(new LocalDate("2017-03-24"))
    }

  }

}
