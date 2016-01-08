package views.support

import com.gu.i18n.{CountryGroup, Country}
import model.AddressValidationRules

object CountryOps {
  implicit class CountryWithAddressFields(country: Country) {
    def postcodeLabel: String = {
      import com.gu.i18n.Country._

      country match {
        case US => "ZIP code"
        case Canada => "Postal code"
        case _ => "Postcode"
      }
    }

    def subdivisionLabel: String = {
      import com.gu.i18n.CountryGroup._

      CountryGroup.byCountryCode(country.alpha2) match {
        case Some(UK) => "County"
        case Some(US) => "State"
        case Some(Australia) => "State/Territory"
        case Some(Canada) => "Province/Territory"
        case _ => "State/County"
      }
    }

    def validationRules: AddressValidationRules = AddressValidationRules(country)
  }
}
