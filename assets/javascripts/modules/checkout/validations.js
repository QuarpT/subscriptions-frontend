define(['$', 'modules/checkout/form-elements'], function ($, form) {

    var ERROR_CLASS = 'form-field--error';

    var mandatoryFieldsPersonalDetails = [
        {input: form.$FIRST_NAME, container: form.$FIRST_NAME_CONTAINER},
        {input: form.$LAST_NAME, container: form.$LAST_NAME_CONTAINER},
        {input: form.$ADDRESS1, container: form.$ADDRESS1_CONTAINER},
        {input: form.$ADDRESS2, container: form.$ADDRESS2_CONTAINER},
        {input: form.$ADDRESS3, container: form.$ADDRESS3_CONTAINER},
        {input: form.$POSTCODE, container: form.$POSTCODE_CONTAINER}
    ];

    function toggleError(container, condition) {
        if (condition) {
            container.addClass(ERROR_CLASS);
        } else {
            container.removeClass(ERROR_CLASS);
        }
    }

    function isNumber(s){
        return /[^\d]+/.exec(s) == null;
    }

    var validatePersonalDetails = function () {
        var emptyFields = mandatoryFieldsPersonalDetails.filter(function (field) {
            var isEmpty = field.input.val() == '';
            toggleError(field.container, isEmpty);
            return isEmpty;
        });
        var noEmptyFields = emptyFields.length == 0;

        var validEmail = form.$EMAIL.val().indexOf('@') > 0;
        toggleError(form.$EMAIL_CONTAINER, !validEmail);

        var emailCorrectTwice = form.$EMAIL.val() == form.$CONFIRM_EMAIL.val();
        toggleError(form.$CONFIRM_EMAIL_CONTAINER, validEmail && !emailCorrectTwice);

        return noEmptyFields && emailCorrectTwice && validEmail;
    };


    var validatePaymentDetails = function () {
        var accountNumberValid = form.$ACCOUNT.val() != ''
            && form.$ACCOUNT.val().length <= 10
            && isNumber(form.$ACCOUNT.val());
        toggleError(form.$ACCOUNT_CONTAINER, !accountNumberValid);

        var holderNameValid = form.$HOLDER.val() != ''
            && form.$HOLDER.val().length <= 18;
        toggleError(form.$HOLDER_CONTAINER, !holderNameValid);

        var sortCodeValid = [form.$SORTCODE1, form.$SORTCODE2, form.$SORTCODE3].filter(function (field) {
            var codeAsNumber = parseInt(field.val(), 10);
            var isValid = codeAsNumber >= 10 && codeAsNumber <= 99;
            return isValid;
        }).length == 3;
        toggleError(form.$SORTCODE_CONTAINER, !sortCodeValid);

        var detailsConfirmed = form.$CONFIRM_PAYMENT[0].checked;
        toggleError(form.$CONFIRM_PAYMENT_CONTAINER, !detailsConfirmed);

        return accountNumberValid && sortCodeValid && holderNameValid && detailsConfirmed;
    };

    return {
        validatePersonalDetails: validatePersonalDetails,
        validatePaymentDetails: validatePaymentDetails
    }

});