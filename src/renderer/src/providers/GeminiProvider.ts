import {
  Content,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  InlineDataPart,
  Part,
  RequestOptions,
  TextPart
} from '@google/generative-ai'
import { isEmbeddingModel } from '@renderer/config/models'
import { SUMMARIZE_PROMPT } from '@renderer/config/prompts'
import { getAssistantSettings, getDefaultModel, getTopNamingModel } from '@renderer/services/AssistantService'
import { EVENT_NAMES } from '@renderer/services/EventService'
import { filterContextMessages } from '@renderer/services/MessagesService'
import { Assistant, FileTypes, Message, Provider, Suggestion } from '@renderer/types'
import axios from 'axios'
import { first, isEmpty, last, takeRight } from 'lodash'
import OpenAI from 'openai'

import { CompletionsParams } from '.'
import BaseProvider from './BaseProvider'

export default class GeminiProvider extends BaseProvider {
  private sdk: GoogleGenerativeAI
  private requestOptions: RequestOptions

  constructor(provider: Provider) {
    super(provider)
    this.sdk = new GoogleGenerativeAI(this.apiKey)
    this.requestOptions = {
      baseUrl: this.provider.apiHost
    }
  }

  private async getMessageContents(message: Message): Promise<Content> {
    const role = message.role === 'user' ? 'user' : 'model'

    const parts: Part[] = [{ text: await this.getMessageContent(message) }]

    for (const file of message.files || []) {
      if (file.type === FileTypes.IMAGE) {
        const base64Data = await window.api.file.base64Image(file.id + file.ext)
        parts.push({
          inlineData: {
            data: base64Data.base64,
            mimeType: base64Data.mime
          }
        } as InlineDataPart)
      }
      if ([FileTypes.TEXT, FileTypes.DOCUMENT].includes(file.type)) {
        const fileContent = await (await window.api.file.read(file.id + file.ext)).trim()
        parts.push({
          text: file.origin_name + '\n' + fileContent
        } as TextPart)
      }
    }

    return {
      role,
      parts
    }
  }

  public async completions({ messages, assistant, onChunk, onFilterMessages }: CompletionsParams) {
    const defaultModel = getDefaultModel()
    const model = assistant.model || defaultModel
    const { contextCount, maxTokens, streamOutput } = getAssistantSettings(assistant)

    const userMessages = filterContextMessages(takeRight(messages, contextCount + 2))
    onFilterMessages(userMessages)

    if (first(userMessages)?.role === 'assistant') {
      userMessages.shift()
    }

    const userLastMessage = userMessages.pop()

    const history: Content[] = []

    for (const message of userMessages) {
      history.push(await this.getMessageContents(message))
    }

    const geminiModel = this.sdk.getGenerativeModel(
      {
        model: model.id,
        systemInstruction: assistant.prompt,
        // @ts-ignore googleSearch is not a valid tool for Gemini
        tools: assistant.enableWebSearch ? [{ googleSearch: {} }] : [],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: assistant?.settings?.temperature,
          topP: assistant?.settings?.topP
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE
          },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      },
      this.requestOptions
    )

    const chat = geminiModel.startChat({ history })
    const messageContents = await this.getMessageContents(userLastMessage!)

    const start_time_millsec = new Date().getTime()

    if (!streamOutput) {
      const { response } = await chat.sendMessage(messageContents.parts)
      const time_completion_millsec = new Date().getTime() - start_time_millsec
      onChunk({
        text: response.candidates?.[0].content.parts[0].text,
        usage: {
          prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.usageMetadata?.totalTokenCount || 0
        },
        metrics: {
          completion_tokens: response.usageMetadata?.candidatesTokenCount,
          time_completion_millsec,
          time_first_token_millsec: 0
        }
      })
      return
    }

    const userMessagesStream = await chat.sendMessageStream(messageContents.parts)
    let time_first_token_millsec = 0

    for await (const chunk of userMessagesStream.stream) {
      if (window.keyv.get(EVENT_NAMES.CHAT_COMPLETION_PAUSED)) break
      if (time_first_token_millsec == 0) {
        time_first_token_millsec = new Date().getTime() - start_time_millsec
      }
      const time_completion_millsec = new Date().getTime() - start_time_millsec
      onChunk({
        text: chunk.text(),
        usage: {
          prompt_tokens: chunk.usageMetadata?.promptTokenCount || 0,
          completion_tokens: chunk.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: chunk.usageMetadata?.totalTokenCount || 0
        },
        metrics: {
          completion_tokens: chunk.usageMetadata?.candidatesTokenCount,
          time_completion_millsec,
          time_first_token_millsec
        }
      })
    }
  }

  async translate(message: Message, assistant: Assistant) {
    const defaultModel = getDefaultModel()
    const { maxTokens } = getAssistantSettings(assistant)
    const model = assistant.model || defaultModel

    const geminiModel = this.sdk.getGenerativeModel(
      {
        model: model.id,
        systemInstruction: assistant.prompt,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: assistant?.settings?.temperature
        }
      },
      this.requestOptions
    )

    const { response } = await geminiModel.generateContent(message.content)

    return response.text()
  }

  public async summaries(messages: Message[], assistant: Assistant): Promise<string> {
    const model = getTopNamingModel() || assistant.model || getDefaultModel()

    const userMessages = takeRight(messages, 5)
      .filter((message) => !message.isPreset)
      .map((message) => ({
        role: message.role,
        content: message.content
      }))

    const userMessageContent = userMessages.reduce((prev, curr) => {
      const content = curr.role === 'user' ? `User: ${curr.content}` : `Assistant: ${curr.content}`
      return prev + (prev ? '\n' : '') + content
    }, '')

    const systemMessage = {
      role: 'system',
      content: SUMMARIZE_PROMPT
    }

    const userMessage = {
      role: 'user',
      content: userMessageContent
    }

    const geminiModel = this.sdk.getGenerativeModel(
      {
        model: model.id,
        systemInstruction: systemMessage.content,
        generationConfig: {
          temperature: assistant?.settings?.temperature
        }
      },
      this.requestOptions
    )

    const chat = await geminiModel.startChat()

    const { response } = await chat.sendMessage(userMessage.content)

    return response.text()
  }

  public async generateText({ prompt, content }: { prompt: string; content: string }): Promise<string> {
    const model = getDefaultModel()
    const systemMessage = { role: 'system', content: prompt }

    const geminiModel = this.sdk.getGenerativeModel({ model: model.id }, this.requestOptions)

    const chat = await geminiModel.startChat({ systemInstruction: systemMessage.content })
    const { response } = await chat.sendMessage(content)

    return response.text()
  }

  public async suggestions(): Promise<Suggestion[]> {
    return []
  }

  public async generateImage(): Promise<string[]> {
    return []
  }

  public async check(): Promise<{ valid: boolean; error: Error | null }> {
    const model = last(this.provider.models.filter((m) => !isEmbeddingModel(m)))

    if (!model) {
      return { valid: false, error: new Error('No model found') }
    }

    const body = {
      model: model.id,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 100,
      stream: false
    }

    try {
      const geminiModel = this.sdk.getGenerativeModel({ model: body.model }, this.requestOptions)
      const result = await geminiModel.generateContent(body.messages[0].content)
      return {
        valid: !isEmpty(result.response.text()),
        error: null
      }
    } catch (error: any) {
      return {
        valid: false,
        error
      }
    }
  }

  public async models(): Promise<OpenAI.Models.Model[]> {
    try {
      const api = this.provider.apiHost + '/v1beta/models'
      const { data } = await axios.get(api, { params: { key: this.apiKey } })
      return data.models.map(
        (m: any) =>
          ({
            id: m.name.replace('models/', ''),
            name: m.displayName,
            description: m.description,
            object: 'model',
            created: Date.now(),
            owned_by: 'gemini'
          }) as OpenAI.Models.Model
      )
    } catch (error) {
      return []
    }
  }
}
