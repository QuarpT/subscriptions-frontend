package model

import com.github.nscala_time.time.OrderingImplicits._
import com.gu.memsub.Benefit._
import com.gu.memsub.BillingPeriod.{OneOffPeriod, SixWeeks}
import com.gu.memsub.Product.{Delivery, Voucher}
import com.gu.memsub._
import com.gu.memsub.subsv2.SubscriptionPlan.{Paid, PaperPlan, WeeklyPlan}
import com.gu.memsub.subsv2.{PaidCharge, PaidSubscriptionPlan, Subscription}
import com.typesafe.scalalogging.LazyLogging
import controllers.ContextLogging
import model.BillingPeriodOps._
import org.joda.time.LocalDate.now
import PartialFunction.cond
import scala.reflect.internal.util.StringOps
import scalaz.syntax.std.boolean._

object SubscriptionOps extends LazyLogging {

  type WeeklyPlanOneOff = PaidSubscriptionPlan[Product.Weekly, PaidCharge[Weekly.type, OneOffPeriod]]

  implicit class EnrichedPaidSubscription[P <: Paid](subscription: Subscription[P]) {

    def isHomeDelivery: Boolean = containsPlanFor(Delivery)

    def isVoucher: Boolean = containsPlanFor(Voucher)

    def isDigitalPack: Boolean = containsPlanFor(com.gu.memsub.Product.Digipack)

    def isGuardianWeekly = subscription.plans.list.exists(plan => cond(plan.product) { case _: Product.Weekly => true })

    private def containsPlanFor(p:Product):Boolean = subscription.plans.list.exists(_.product == p)

    def productType: String = {
      if (isHomeDelivery) {
        "Home Delivery"
      } else if (isVoucher) {
        "Voucher Book"
      } else if (isDigitalPack) {
        "Digital Pack"
      } else if (isGuardianWeekly) {
        "Guardian Weekly"
      } else {
        "Unknown"
      }
    }


    def packageName: String = firstPlan.charges.benefits.list match {
      case Digipack :: Nil => "Guardian Digital Pack"
      case Weekly :: Nil => "The Guardian Weekly"
      case _ => s"${firstPlan.name} package"
    }

    def subtitle: Option[String] = firstPlan.charges.benefits.list match {
      case Digipack :: Nil => Some("Daily Edition + Guardian App Premium Tier")
      case _ => StringOps.oempty(firstPlan.description).headOption
    }

    def title: String = firstPlan.charges.benefits.list match {
      case Digipack :: Nil => "Guardian Digital Pack"
      case Weekly :: Nil => "Guardian Weekly"
      case x => "Guardian/Observer Newspapers"
    }

    def hasDigitalPack: Boolean = subscription.plans.list.exists(_.charges.benefits.list.contains(Digipack))

    def phone: String = "+44 (0) 330 333 6767"

    def email: String = (
      subscription.isHomeDelivery.option("homedelivery@theguardian.com") orElse
        subscription.isVoucher.option("vouchersubs@theguardian.com") orElse
        subscription.hasDigitalPack.option("digitalpack@theguardian.com") orElse
        subscription.isGuardianWeekly.option("gwsubs@theguardian.com")
      ).getOrElse("subscriptions@theguardian.com")


    val currency = subscription.plans.head.charges.currencies.head
    val nextPlan = subscription.plans.list.maxBy(_.end)
    val planToManage = {
      lazy val coveringPlans = subscription.plans.list.filter(p => (p.start.isEqual(now) || p.start.isBefore(now)) && p.end.isAfter(now))
      lazy val expiredPlans = subscription.plans.list.filter(p => p.end.isBefore(now) || p.end.isEqual(now))

      // The user's sub might be in many situations:

      if (coveringPlans.nonEmpty) {
        // Has a plan which is currently active (i.e today sits within the plan's start and end dates)
        coveringPlans.maxBy(_.end)
      } else if (expiredPlans.nonEmpty) {
        // Has a plan which has recently expired
        expiredPlans.maxBy(_.end)
      } else {
        // Has a plan(s) starting soon
        if (subscription.plans.size > 1) {
          logger.warn("User has multiple future plans, we are showing them their last ending plan")
        }
        nextPlan
      }
    }

    def firstPlan = sortedPlans.head
    def currentPlans = subscription.plans.list.filter(p => (p.start == now || p.start.isBefore(now)) && p.end.isAfter(now))
    def futurePlans = subscription.plans.list.filter(_.start.isAfter(now) ).sortBy(_.start)
    def nonExpiredSubscriptions = subscription.plans.list.filter(_.end.isAfter(now))
    def sortedPlans = subscription.plans.list.sortBy(_.start)
    def recurringPlans = subscription.plans.list.filter(p => p.end.isAfter(now) && p.charges.billingPeriod.isRecurring)
    def oneOffPlans = subscription.plans.list.filterNot(p => p.end.isBefore(now) || p.charges.billingPeriod.isRecurring)
    def introductoryPeriodPlan = oneOffPlans.find(_.charges.billingPeriod == SixWeeks)
    def hasIntroductoryPeriod = introductoryPeriodPlan.isDefined
  }

  implicit class EnrichedPaperSubscription[P <: PaperPlan](subscription: Subscription[P]) extends ContextLogging {
    implicit val subContext = subscription
    val renewable = {
      val wontAutoRenew = !subscription.autoRenew
      val startedAlready = !subscription.termStartDate.isAfter(now)
      val isOneOffPlan = !subscription.planToManage.charges.billingPeriod.isRecurring
      info(s"testing if renewable - wontAutoRenew: $wontAutoRenew, startedAlready: $startedAlready, isOneOffPlan: $isOneOffPlan")
      wontAutoRenew && startedAlready && isOneOffPlan
    }
  }

  implicit class EnrichedWeeklySubscription[P <: WeeklyPlan](subscription: Subscription[P]) {
    def asRenewable = if (subscription.renewable) Some(subscription.asInstanceOf[Subscription[WeeklyPlanOneOff]]) else None
    def secondPaymentDate = if (subscription.hasIntroductoryPeriod) subscription.acceptanceDate else subscription.acceptanceDate plusMonths subscription.plan.charges.billingPeriod.monthsInPeriod

  }
}
