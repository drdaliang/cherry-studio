import { LoadingOutlined, MinusOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import VisionIcon from '@renderer/components/Icons/VisionIcon'
import WebSearchIcon from '@renderer/components/Icons/WebSearchIcon'
import { Center } from '@renderer/components/Layout'
import { getModelLogo, isEmbeddingModel, isVisionModel, isWebSearchModel, SYSTEM_MODELS } from '@renderer/config/models'
import { useProvider } from '@renderer/hooks/useProvider'
import { fetchModels } from '@renderer/services/ApiService'
import { Model, Provider } from '@renderer/types'
import { getDefaultGroupName, isFreeModel, runAsyncFunction } from '@renderer/utils'
import { Avatar, Button, Empty, Flex, Modal, Popover, Radio, Tag } from 'antd'
import Search from 'antd/es/input/Search'
import { groupBy, isEmpty, uniqBy } from 'lodash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { TopView } from '../../../components/TopView'

interface ShowParams {
  provider: Provider
}

interface Props extends ShowParams {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ provider: _provider, resolve }) => {
  const [open, setOpen] = useState(true)
  const { provider, models, addModel, removeModel } = useProvider(_provider.id)
  const [listModels, setListModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const { t, i18n } = useTranslation()

  const systemModels = SYSTEM_MODELS[_provider.id] || []
  const allModels = uniqBy([...systemModels, ...listModels, ...models], 'id')

  const list = allModels.filter((model) => {
    if (searchText && !model.id.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) {
      return false
    }
    switch (filterType) {
      case 'vision':
        return isVisionModel(model)
      case 'websearch':
        return isWebSearchModel(model)
      case 'free':
        return isFreeModel(model)
      case 'embedding':
        return isEmbeddingModel(model)
      default:
        return true
    }
  })

  const modelGroups = groupBy(list, 'group')

  const onOk = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve({})
  }

  const onAddModel = (model: Model) => {
    addModel(model)
  }

  const onRemoveModel = (model: Model) => {
    removeModel(model)
  }

  useEffect(() => {
    runAsyncFunction(async () => {
      try {
        setLoading(true)
        const models = await fetchModels(_provider)
        setListModels(
          models.map((model) => ({
            id: model.id,
            // @ts-ignore name
            name: model.name || model.id,
            provider: _provider.id,
            group: getDefaultGroupName(model.id),
            // @ts-ignore name
            description: model?.description,
            owned_by: model?.owned_by
          }))
        )
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ModalHeader = () => {
    return (
      <Flex>
        <ModelHeaderTitle>
          {provider.isSystem ? t(`provider.${provider.id}`) : provider.name}
          {i18n.language.startsWith('zh') ? '' : ' '}
          {t('common.models')}
        </ModelHeaderTitle>
        {loading && <LoadingOutlined size={20} />}
      </Flex>
    )
  }

  return (
    <Modal
      title={<ModalHeader />}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={onClose}
      footer={null}
      width="600px"
      styles={{
        content: { padding: 0 },
        header: { padding: 22, paddingBottom: 15 }
      }}
      centered>
      <SearchContainer>
        <Center>
          <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)} buttonStyle="solid">
            <Radio.Button value="all">{t('models.all')}</Radio.Button>
            <Radio.Button value="vision">{t('models.vision')}</Radio.Button>
            <Radio.Button value="websearch">{t('models.websearch')}</Radio.Button>
            <Radio.Button value="free">{t('models.free')}</Radio.Button>
            <Radio.Button value="embedding">{t('models.embedding')}</Radio.Button>
          </Radio.Group>
        </Center>
        <Search placeholder={t('settings.provider.search_placeholder')} allowClear onSearch={setSearchText} />
      </SearchContainer>
      <ListContainer>
        {Object.keys(modelGroups).map((group) => (
          <div key={group}>
            <ListHeader key={group}>{group}</ListHeader>
            {modelGroups[group].map((model) => {
              const hasModel = provider.models.find((m) => m.id === model.id)
              return (
                <ListItem key={model.id}>
                  <ListItemHeader>
                    <Avatar src={getModelLogo(model.id)} size={24}>
                      {model.name[0].toUpperCase()}
                    </Avatar>
                    <ListItemName>
                      {model.name}
                      {isVisionModel(model) && <VisionIcon />}
                      {isWebSearchModel(model) && <WebSearchIcon />}
                      {isFreeModel(model) && (
                        <Tag style={{ marginLeft: 10 }} color="green">
                          {t('models.free')}
                        </Tag>
                      )}
                      {isEmbeddingModel(model) && (
                        <Tag style={{ marginLeft: 10 }} color="orange">
                          {t('models.embedding')}
                        </Tag>
                      )}
                      {!isEmpty(model.description) && (
                        <Popover
                          trigger="click"
                          title={model.name}
                          content={model.description}
                          overlayStyle={{ maxWidth: 600 }}>
                          <Question />
                        </Popover>
                      )}
                    </ListItemName>
                  </ListItemHeader>
                  {hasModel ? (
                    <Button type="default" onClick={() => onRemoveModel(model)} icon={<MinusOutlined />} />
                  ) : (
                    <Button type="primary" onClick={() => onAddModel(model)} icon={<PlusOutlined />} />
                  )}
                </ListItem>
              )
            })}
          </div>
        ))}
        {isEmpty(list) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('settings.models.empty')} />}
      </ListContainer>
    </Modal>
  )
}

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 22px;
  padding-bottom: 20px;
  margin-top: -10px;

  .ant-radio-group {
    display: flex;
    flex-wrap: wrap;
  }
`

const ListContainer = styled.div`
  max-height: 70vh;
  overflow-y: scroll;
  padding-bottom: 20px;
`

const ListHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-background-soft);
  padding: 8px 22px;
  color: var(--color-text);
  opacity: 0.4;
`

const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 22px;
`

const ListItemHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-right: 10px;
  height: 22px;
`

const ListItemName = styled.div`
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  margin-left: 6px;
`

const ModelHeaderTitle = styled.div`
  color: var(--color-text);
  font-size: 18px;
  font-weight: 600;
  margin-right: 10px;
`

const Question = styled(QuestionCircleOutlined)`
  cursor: pointer;
  margin: 0 10px;
  color: #888;
`

export default class EditModelsPopup {
  static topviewId = 0
  static hide() {
    TopView.hide('EditModelsPopup')
  }
  static show(props: ShowParams) {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        'EditModelsPopup'
      )
    })
  }
}
