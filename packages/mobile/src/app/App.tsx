import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import { DeviceEventEmitter, Linking, StatusBar, YellowBox } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { enableScreens } from 'react-native-screens'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { apolloClient } from 'src/apollo/index'
import { openDeepLink } from 'src/app/actions'
import AppLoading from 'src/app/AppLoading'
import ErrorBoundary from 'src/app/ErrorBoundary'
import i18n from 'src/i18n'
import NavigatorWrapper from 'src/navigator/NavigatorWrapper'
import { persistor, store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

enableScreens()

Logger.debug('App/init', 'Current Language: ' + i18n.language)
YellowBox.ignoreWarnings([
  'componentWillReceiveProps',
  'Remote debugger', // To avoid "Remote debugger in background tab" warning
  'cancelTouches', // rn-screens warning on iOS
  'Setting a timer', // warns about long setTimeouts which are actually saga timeouts
])

const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()

BigNumber.config({
  FORMAT: {
    decimalSeparator,
    groupSeparator: groupingSeparator,
  },
})

export class App extends React.Component {
  async componentDidMount() {
    CeloAnalytics.track(DefaultEventNames.appLoaded, this.props, true)
    const appLoadedAt: Date = new Date()
    const appStartListener = DeviceEventEmitter.addListener(
      'AppStartedLoading',
      (appInitializedAtString: string) => {
        const appInitializedAt = new Date(appInitializedAtString)
        const tti = appLoadedAt.getTime() - appInitializedAt.getTime()
        CeloAnalytics.track(DefaultEventNames.appLoadTTIInMilliseconds, { tti }, true)
        appStartListener.remove()
      }
    )

    Linking.addEventListener('url', this.handleOpenURL)
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL)
  }

  handleOpenURL = (event: any) => {
    store.dispatch(openDeepLink(event.url))
  }

  render() {
    return (
      /*
      // @ts-ignore */
      <ApolloProvider client={apolloClient}>
        <Provider store={store}>
          <PersistGate loading={<AppLoading />} persistor={persistor}>
            <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
            <ErrorBoundary>
              <NavigatorWrapper />
            </ErrorBoundary>
          </PersistGate>
        </Provider>
      </ApolloProvider>
    )
  }
}

export default App
