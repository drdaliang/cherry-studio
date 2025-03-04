import type { ExtractChunkData } from '@llm-tools/embedjs-interfaces'
import { TopView } from '@renderer/components/TopView'
import { getKnowledgeBaseParams } from '@renderer/services/KnowledgeService'
import { KnowledgeBase } from '@renderer/types'
import { Input, List, Modal, Spin, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { Search } = Input
const { Text, Paragraph } = Typography

interface ShowParams {
  base: KnowledgeBase
}

interface Props extends ShowParams {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ base, resolve }) => {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ExtractChunkData[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const { t } = useTranslation()

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([])
      setSearchKeyword('')
      return
    }

    setSearchKeyword(value.trim())
    setLoading(true)
    try {
      const searchResults = await window.api.knowledgeBase.search({
        search: value,
        base: getKnowledgeBaseParams(base)
      })
      setResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const onOk = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve({})
  }

  KnowledgeSearchPopup.hide = onCancel

  const highlightText = (text: string) => {
    if (!searchKeyword) return text
    const parts = text.split(new RegExp(`(${searchKeyword})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchKeyword.toLowerCase() ? <mark key={i}>{part}</mark> : part
    )
  }

  return (
    <Modal
      title={t('knowledge_base.search')}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={onClose}
      width={800}
      footer={null}
      centered
      transitionName="ant-move-down">
      <SearchContainer>
        <Search
          placeholder={t('knowledge_base.search_placeholder')}
          allowClear
          enterButton
          size="large"
          onSearch={handleSearch}
        />
        <ResultsContainer>
          {loading ? (
            <LoadingContainer>
              <Spin size="large" />
            </LoadingContainer>
          ) : (
            <List
              dataSource={results}
              renderItem={(item) => (
                <List.Item>
                  <ResultItem>
                    <ScoreTag>Score: {(item.score * 100).toFixed(1)}%</ScoreTag>
                    <Paragraph>{highlightText(item.pageContent)}</Paragraph>
                    <MetadataContainer>
                      <Text type="secondary">Source: {item.metadata.source}</Text>
                    </MetadataContainer>
                  </ResultItem>
                </List.Item>
              )}
            />
          )}
        </ResultsContainer>
      </SearchContainer>
    </Modal>
  )
}

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ResultsContainer = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`

const ResultItem = styled.div`
  width: 100%;
  position: relative;
  padding: 16px;
  background: var(--color-background-soft);
  border-radius: 8px;
`

const ScoreTag = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
  font-size: 12px;
`

const MetadataContainer = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
`

const TopViewKey = 'KnowledgeSearchPopup'

export default class KnowledgeSearchPopup {
  static topviewId = 0
  static hide() {
    TopView.hide(TopViewKey)
  }
  static show(props: ShowParams) {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(v) => {
            resolve(v)
            TopView.hide(TopViewKey)
          }}
        />,
        TopViewKey
      )
    })
  }
}
