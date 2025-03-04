import { REFERENCE_PROMPT } from '@renderer/config/prompts'
import { getOllamaKeepAliveTime } from '@renderer/hooks/useOllama'
import { getKnowledgeBaseParams } from '@renderer/services/KnowledgeService'
import store from '@renderer/store'
import { Assistant, Message, Provider, Suggestion } from '@renderer/types'
import { delay } from '@renderer/utils'
import { take } from 'lodash'
import OpenAI from 'openai'

import { CompletionsParams } from '.'

export default abstract class BaseProvider {
  protected provider: Provider
  protected host: string
  protected apiKey: string

  constructor(provider: Provider) {
    this.provider = provider
    this.host = this.getBaseURL()
    this.apiKey = this.getApiKey()
  }

  abstract completions({ messages, assistant, onChunk, onFilterMessages }: CompletionsParams): Promise<void>
  abstract translate(message: Message, assistant: Assistant): Promise<string>
  abstract summaries(messages: Message[], assistant: Assistant): Promise<string>
  abstract suggestions(messages: Message[], assistant: Assistant): Promise<Suggestion[]>
  abstract generateText({ prompt, content }: { prompt: string; content: string }): Promise<string>
  abstract check(): Promise<{ valid: boolean; error: Error | null }>
  abstract models(): Promise<OpenAI.Models.Model[]>
  abstract generateImage(_params: {
    prompt: string
    negativePrompt: string
    imageSize: string
    batchSize: number
    seed?: string
    numInferenceSteps: number
    guidanceScale: number
    signal?: AbortSignal
  }): Promise<string[]>

  public getBaseURL(): string {
    const host = this.provider.apiHost
    return host.endsWith('/') ? host : `${host}/v1/`
  }

  public getApiKey() {
    const keys = this.provider.apiKey.split(',').map((key) => key.trim())
    const keyName = `provider:${this.provider.id}:last_used_key`

    if (keys.length === 1) {
      return keys[0]
    }

    const lastUsedKey = window.keyv.get(keyName)
    if (!lastUsedKey) {
      window.keyv.set(keyName, keys[0])
      return keys[0]
    }

    const currentIndex = keys.indexOf(lastUsedKey)
    const nextIndex = (currentIndex + 1) % keys.length
    const nextKey = keys[nextIndex]
    window.keyv.set(keyName, nextKey)

    return nextKey
  }

  public defaultHeaders() {
    return {
      'X-Api-Key': this.apiKey
    }
  }

  public get keepAliveTime() {
    return this.provider.id === 'ollama' ? getOllamaKeepAliveTime() : undefined
  }

  public async fakeCompletions({ onChunk }: CompletionsParams) {
    for (let i = 0; i < 100; i++) {
      await delay(0.01)
      onChunk({ text: i + '\n', usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 } })
    }
  }

  public async getMessageContent(message: Message) {
    if (!message.knowledgeBaseIds) {
      return message.content
    }

    const knowledgeId = message.knowledgeBaseIds[0]
    const base = store.getState().knowledge.bases.find((kb) => kb.id === knowledgeId)

    if (!base) {
      return message.content
    }

    const searchResults = await window.api.knowledgeBase.search({
      search: message.content,
      base: getKnowledgeBaseParams(base)
    })

    const references = take(searchResults, 6).map((item, index) => {
      const sourceUrl = item.metadata.source
      const baseItem = base.items.find((i) => i.uniqueId === item.metadata.uniqueLoaderId)

      return {
        id: index,
        content: item.pageContent,
        url: encodeURIComponent(sourceUrl),
        type: baseItem?.type
      }
    })

    const referencesContent = JSON.stringify(references, null, 2)

    return REFERENCE_PROMPT.replace('{question}', message.content).replace('{references}', referencesContent)
  }
}
