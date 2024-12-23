import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'
import { createWrapper } from 'next-redux-wrapper'

import { connectSlice } from './connectSlice'
import { paramsSlice } from './paramsSlice'
import { streamSlice } from './streamSlice'

const makeStore = () =>
  configureStore({
    reducer: {
      [connectSlice.name]: connectSlice.reducer,
      [streamSlice.name]: streamSlice.reducer,
      [paramsSlice.name]: paramsSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: [
            'stream/setNewBlock',
            'stream/setSubsNewBlock',
            'stream/setTxEvent',
            'stream/setSubsTxEvent',
            'connect/setTmClient',
          ],
          // Ignore these paths in the state
          ignoredPaths: [
            'connect.tmClient',
            'stream.subsNewBlock',
            'stream.subsTxEvent',
            'stream.newBlock',
            'stream.txEvent',
          ],
        },
      }),
    devTools: true,
  })

export type AppStore = ReturnType<typeof makeStore>
export type AppState = ReturnType<AppStore['getState']>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action
>

export const wrapper = createWrapper<AppStore>(makeStore)
