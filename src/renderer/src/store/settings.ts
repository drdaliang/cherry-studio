import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TRANSLATE_PROMPT } from '@renderer/config/prompts'
import { CodeStyleVarious, LanguageVarious, ThemeMode } from '@renderer/types'

export type SendMessageShortcut = 'Enter' | 'Shift+Enter' | 'Ctrl+Enter' | 'Command+Enter'

export interface SettingsState {
  showAssistants: boolean
  showTopics: boolean
  sendMessageShortcut: SendMessageShortcut
  language: LanguageVarious
  proxyMode: 'system' | 'custom' | 'none'
  proxyUrl?: string
  userName: string
  showMessageDivider: boolean
  messageFont: 'system' | 'serif'
  showInputEstimatedTokens: boolean
  tray: boolean
  theme: ThemeMode
  windowStyle: 'transparent' | 'opaque'
  fontSize: number
  topicPosition: 'left' | 'right'
  showTopicTime: boolean
  pasteLongTextAsFile: boolean
  pasteLongTextThreshold: number
  clickAssistantToShowTopic: boolean
  manualUpdateCheck: boolean
  renderInputMessageAsMarkdown: boolean
  codeShowLineNumbers: boolean
  codeCollapsible: boolean
  mathEngine: 'MathJax' | 'KaTeX'
  messageStyle: 'plain' | 'bubble'
  codeStyle: CodeStyleVarious
  // webdav 配置 host, user, pass, path
  webdavHost: string
  webdavUser: string
  webdavPass: string
  webdavPath: string
  webdavAutoSync: boolean
  webdavSyncInterval: number
  translateModelPrompt: string
  autoTranslateWithSpace: boolean
  enableTopicNaming: boolean
  // Sidebar icons
  showMinappIcon: boolean
  showFilesIcon: boolean
}

const initialState: SettingsState = {
  showAssistants: true,
  showTopics: true,
  sendMessageShortcut: 'Enter',
  language: navigator.language as LanguageVarious,
  proxyMode: 'system',
  proxyUrl: undefined,
  userName: '',
  showMessageDivider: true,
  messageFont: 'system',
  showInputEstimatedTokens: false,
  tray: true,
  theme: ThemeMode.auto,
  windowStyle: 'transparent',
  fontSize: 14,
  topicPosition: 'left',
  showTopicTime: false,
  pasteLongTextAsFile: false,
  pasteLongTextThreshold: 1500,
  clickAssistantToShowTopic: false,
  manualUpdateCheck: false,
  renderInputMessageAsMarkdown: false,
  codeShowLineNumbers: false,
  codeCollapsible: false,
  mathEngine: 'MathJax',
  messageStyle: 'plain',
  codeStyle: 'auto',
  webdavHost: '',
  webdavUser: '',
  webdavPass: '',
  webdavPath: '/cherry-studio',
  webdavAutoSync: false,
  webdavSyncInterval: 5,
  translateModelPrompt: TRANSLATE_PROMPT,
  autoTranslateWithSpace: false,
  enableTopicNaming: true,
  showMinappIcon: true,
  showFilesIcon: true
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setShowAssistants: (state, action: PayloadAction<boolean>) => {
      state.showAssistants = action.payload
    },
    toggleShowAssistants: (state) => {
      state.showAssistants = !state.showAssistants
    },
    setShowTopics: (state, action: PayloadAction<boolean>) => {
      state.showTopics = action.payload
    },
    toggleShowTopics: (state) => {
      state.showTopics = !state.showTopics
    },
    setSendMessageShortcut: (state, action: PayloadAction<SendMessageShortcut>) => {
      state.sendMessageShortcut = action.payload
    },
    setLanguage: (state, action: PayloadAction<LanguageVarious>) => {
      state.language = action.payload
    },
    setProxyMode: (state, action: PayloadAction<'system' | 'custom' | 'none'>) => {
      state.proxyMode = action.payload
    },
    setProxyUrl: (state, action: PayloadAction<string | undefined>) => {
      state.proxyUrl = action.payload
    },
    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload
    },
    setShowMessageDivider: (state, action: PayloadAction<boolean>) => {
      state.showMessageDivider = action.payload
    },
    setMessageFont: (state, action: PayloadAction<'system' | 'serif'>) => {
      state.messageFont = action.payload
    },
    setShowInputEstimatedTokens: (state, action: PayloadAction<boolean>) => {
      state.showInputEstimatedTokens = action.payload
    },
    setTray: (state, action: PayloadAction<boolean>) => {
      state.tray = action.payload
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload
    },
    setWindowStyle: (state, action: PayloadAction<'transparent' | 'opaque'>) => {
      state.windowStyle = action.payload
      console.log(state.windowStyle)
    },
    setTopicPosition: (state, action: PayloadAction<'left' | 'right'>) => {
      state.topicPosition = action.payload
    },
    setShowTopicTime: (state, action: PayloadAction<boolean>) => {
      state.showTopicTime = action.payload
    },
    setPasteLongTextAsFile: (state, action: PayloadAction<boolean>) => {
      state.pasteLongTextAsFile = action.payload
    },
    setRenderInputMessageAsMarkdown: (state, action: PayloadAction<boolean>) => {
      state.renderInputMessageAsMarkdown = action.payload
    },
    setClickAssistantToShowTopic: (state, action: PayloadAction<boolean>) => {
      state.clickAssistantToShowTopic = action.payload
    },
    setManualUpdateCheck: (state, action: PayloadAction<boolean>) => {
      state.manualUpdateCheck = action.payload
    },
    setWebdavHost: (state, action: PayloadAction<string>) => {
      state.webdavHost = action.payload
    },
    setWebdavUser: (state, action: PayloadAction<string>) => {
      state.webdavUser = action.payload
    },
    setWebdavPass: (state, action: PayloadAction<string>) => {
      state.webdavPass = action.payload
    },
    setWebdavPath: (state, action: PayloadAction<string>) => {
      state.webdavPath = action.payload
    },
    setWebdavAutoSync: (state, action: PayloadAction<boolean>) => {
      state.webdavAutoSync = action.payload
    },
    setWebdavSyncInterval: (state, action: PayloadAction<number>) => {
      state.webdavSyncInterval = action.payload
    },
    setCodeShowLineNumbers: (state, action: PayloadAction<boolean>) => {
      state.codeShowLineNumbers = action.payload
    },
    setCodeCollapsible: (state, action: PayloadAction<boolean>) => {
      state.codeCollapsible = action.payload
    },
    setMathEngine: (state, action: PayloadAction<'MathJax' | 'KaTeX'>) => {
      state.mathEngine = action.payload
    },
    setMessageStyle: (state, action: PayloadAction<'plain' | 'bubble'>) => {
      state.messageStyle = action.payload
    },
    setCodeStyle: (state, action: PayloadAction<CodeStyleVarious>) => {
      state.codeStyle = action.payload
    },
    setTranslateModelPrompt: (state, action: PayloadAction<string>) => {
      state.translateModelPrompt = action.payload
    },
    setAutoTranslateWithSpace: (state, action: PayloadAction<boolean>) => {
      state.autoTranslateWithSpace = action.payload
    },
    setEnableTopicNaming: (state, action: PayloadAction<boolean>) => {
      state.enableTopicNaming = action.payload
    },
    setShowMinappIcon: (state, action: PayloadAction<boolean>) => {
      state.showMinappIcon = action.payload
    },
    setShowFilesIcon: (state, action: PayloadAction<boolean>) => {
      state.showFilesIcon = action.payload
    },
    setPasteLongTextThreshold: (state, action: PayloadAction<number>) => {
      state.pasteLongTextThreshold = action.payload
    }
  }
})

export const {
  setShowAssistants,
  toggleShowAssistants,
  setShowTopics,
  toggleShowTopics,
  setSendMessageShortcut,
  setLanguage,
  setProxyMode,
  setProxyUrl,
  setUserName,
  setShowMessageDivider,
  setMessageFont,
  setShowInputEstimatedTokens,
  setTray,
  setTheme,
  setFontSize,
  setWindowStyle,
  setTopicPosition,
  setShowTopicTime,
  setPasteLongTextAsFile,
  setRenderInputMessageAsMarkdown,
  setClickAssistantToShowTopic,
  setManualUpdateCheck,
  setWebdavHost,
  setWebdavUser,
  setWebdavPass,
  setWebdavPath,
  setWebdavAutoSync,
  setWebdavSyncInterval,
  setCodeShowLineNumbers,
  setCodeCollapsible,
  setMathEngine,
  setMessageStyle,
  setCodeStyle,
  setTranslateModelPrompt,
  setAutoTranslateWithSpace,
  setEnableTopicNaming,
  setShowMinappIcon,
  setShowFilesIcon,
  setPasteLongTextThreshold
} = settingsSlice.actions

export default settingsSlice.reducer
