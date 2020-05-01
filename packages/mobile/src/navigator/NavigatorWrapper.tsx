import AsyncStorage from '@react-native-community/async-storage'
import { NavigationContainer, NavigationState } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { useSelector } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { getAppLocked } from 'src/app/selectors'
import { DEV_RESTORE_NAV_STATE_ON_RELOAD } from 'src/config'
import Language from 'src/language/Language'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

// This uses RN Navigation's experimental nav state persistence
// to improve the hot reloading experience when in DEV mode
// https://reactnavigation.org/docs/en/state-persistence.html
const PERSISTENCE_KEY = 'NAVIGATION_STATE'

const getActiveRouteName = (state: NavigationState) => {
  const route = state.routes[state.index]

  if (route.state) {
    // @ts-ignore Dive into nested navigators
    return getActiveRouteName(route.state)
  }

  return route.name
}

const Stack = createStackNavigator()

export const NavigatorWrapper = () => {
  const appLocked = useSelector(getAppLocked)
  const [isReady, setIsReady] = React.useState(
    __DEV__ || DEV_RESTORE_NAV_STATE_ON_RELOAD ? false : true
  )
  const [initialState, setInitialState] = React.useState()

  const routeNameRef = React.useRef()
  const navigationRef = React.useRef()

  React.useEffect(() => {
    SplashScreen.hide()

    if (navigationRef && navigationRef.current) {
      const state = navigationRef.current.getRootState()

      // Save the initial route name
      routeNameRef.current = getActiveRouteName(state)
    }
  }, [])

  React.useEffect(() => {
    const restoreState = async () => {
      const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY)
      if (savedStateString) {
        try {
          const state = JSON.parse(savedStateString)

          setInitialState(state)
        } catch (e) {
          Logger.error('NavigatorWrapper', 'Error getting nav state', e)
        }
      }
      setIsReady(true)
    }

    if (!isReady) {
      restoreState().catch((error) =>
        Logger.error('NavigatorWrapper', 'Error persisting nav state', error)
      )
    }
  }, [isReady])

  // if (!isReady) {
  //   return null
  // }

  const handleStateChange = (state: NavigationState | undefined) => {
    if (state === undefined) {
      return
    }

    AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)).catch((error) =>
      Logger.error('NavigatorWrapper', 'Error persisting nav state', error)
    )

    const previousRouteName = routeNameRef.current
    const currentRouteName = getActiveRouteName(state)

    if (previousRouteName !== currentRouteName) {
      // The line below uses the @react-native-firebase/analytics tracker
      // Change this line to use another Mobile analytics SDK
      CeloAnalytics.page(currentRouteName, {
        previousScreen: previousRouteName,
        currentScreen: currentRouteName,
      })
    }

    // Save the current route name for later comparision
    routeNameRef.current = currentRouteName
  }

  console.log('howdyyyyyy')

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={Screens.Language}>
        <Stack.Screen name={Screens.Language} component={Language} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  floating: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
  locked: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
})

export const navbarStyle: {
  headerMode: 'none'
} = {
  headerMode: 'none',
}

export const headerArea = {
  navigationOptions: {
    headerStyle: {
      elevation: 0,
    },
  },
}

export default NavigatorWrapper
