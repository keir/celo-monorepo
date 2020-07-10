import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { PaymentRequest } from 'src/account/types'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { declinePaymentRequest } from 'src/firebase/actions'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  addressToE164NumberSelector,
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { notificationIncomingRequest } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { listItemRenderer } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  paymentRequests: PaymentRequest[]
}

interface DispatchProps {
  declinePaymentRequest: typeof declinePaymentRequest
  fetchAddressesAndValidate: typeof fetchAddressesAndValidate
}

type Props = OwnProps & DispatchProps & WithTranslation & StateProps

interface StateProps {
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const e164PhoneNumberAddressMapping = e164NumberToAddressSelector(state)
  const addressToE164Number = addressToE164NumberSelector(state)
  const recipientCache = recipientCacheSelector(state)

  return {
    e164PhoneNumberAddressMapping,
    addressToE164Number,
    recipientCache,
  }
}

const mapDispatchToProps = {
  declinePaymentRequest,
  fetchAddressesAndValidate,
}

// Payment Request notification for the notification center on home screen
export class IncomingPaymentRequestSummaryNotification extends React.Component<Props> {
  onReview = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.review,
    })
    navigate(Screens.IncomingPaymentRequestListScreen)
  }

  itemRenderer = (item: PaymentRequest) => {
    return (
      <PaymentRequestNotificationInner
        key={item.uid}
        amount={item.amount}
        recipient={getRecipientFromPaymentRequest(item, this.props.recipientCache)}
      />
    )
  }

  render() {
    const { recipientCache, paymentRequests, t } = this.props

    return paymentRequests.length === 1 ? (
      listItemRenderer({
        // accessing via this.props.<...> to avoid shadowing
        declinePaymentRequest: this.props.declinePaymentRequest,
        recipientCache,
      })(paymentRequests[0])
    ) : (
      <SummaryNotification<PaymentRequest>
        items={paymentRequests}
        title={t('incomingPaymentRequestsSummaryTitle', { count: paymentRequests.length })}
        detailsI18nKey="walletFlow5:incomingPaymentRequestsSummaryDetails"
        icon={<Image source={notificationIncomingRequest} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.walletFlow5)(IncomingPaymentRequestSummaryNotification))
