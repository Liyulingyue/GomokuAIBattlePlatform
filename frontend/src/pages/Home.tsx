import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Button, Space } from 'antd'
import { Link } from 'react-router-dom'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import Navbar from '../components/Navbar'
import './Home.css'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

function Home() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sliderTrackRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const [trackOffset, setTrackOffset] = useState(0)

  const slides = [
    {
      key: 'hero',
      className: 'home-slide home-slide--hero',
      content: (
        <>
          <div className="home-hero-text">
            <Title level={1} className="home-hero-title">五子棋AI对战平台</Title>
            <Paragraph className="home-hero-intro">
              点击下方圆点或使用左右箭头，依次了解平台定位、API 配置信息、单人与多人玩法。
            </Paragraph>
            <Title level={2} className="home-hero-subtitle">接入你的大模型，见证AI的每一步棋</Title>
            <Paragraph>
              将不同的语言大模型接入统一棋战引擎，实时观察AI对弈、策略推演与推理过程。
            </Paragraph>
            <Space size="middle" wrap>
              <Link to="/battle">
                <Button type="primary" size="large">体验单人AI测试</Button>
              </Link>
              <Link to="/room">
                <Button size="large">进入多人对战大厅</Button>
              </Link>
            </Space>
          </div>
          <div className="home-hero-highlight">
            <Text strong>实时轮询 · 配置锁定 · 房主控色 · 对局日志</Text>
          </div>
        </>
      )
    },
    {
      key: 'about',
      className: 'home-slide home-slide--about',
      content: (
        <>
          <Title level={2} className="home-section-title">平台能为你做什么？</Title>
          <Paragraph className="home-section-paragraph">
            这个平台是面向研究者与爱好者的五子棋实验环境。你可以让不同模型对局，逐回合确认落子，
            也可以在训练或调参时对比多种提示词策略的胜率。所有对战过程都透过 Battle Log 记录，
            便于回放与分析。
          </Paragraph>
          <Paragraph className="home-section-paragraph">
            支持任意遵循 OpenAI API 兼容协议的服务，只需在前端填写接口地址、密钥与模型名，
            即可让模型参与对局。我们提供配置锁定、准备确认等机制，确保多人联机时的公平性与流程顺畅。
          </Paragraph>
        </>
      )
    },
    {
      key: 'setup',
      className: 'home-slide home-slide--setup',
      content: (
        <>
          <Title level={2} className="home-section-title">如何准备必要的 API 信息？</Title>
          <ol className="home-steps">
            <li>
              <Text strong>API URL：</Text>
              <span> 获取你所使用服务的兼容 OpenAI 风格的 REST 入口，例如百度文心的 <code>https://aistudio.baidu.com/llm/lmapi/v3</code>。</span>
            </li>
            <li>
              <Text strong>API Key：</Text>
              <span>
                在服务商控制台生成密钥，复制粘贴到平台。可前往
                {' '}<a className="home-link" href="https://aistudio.baidu.com/account/accessToken" target="_blank" rel="noopener noreferrer">百度 AISTUDIO AccessToken</a>{' '}
                页面快速获取，密钥仅保存在浏览器侧，不会上传。
              </span>
            </li>
            <li>
              <Text strong>Model：</Text>
              <span>
                填写要调用的模型标识，如 <code>ernie-3.5-8k</code> 或 <code>gpt-4o-mini</code>，需与服务端对接一致。可在
                {' '}<a className="home-link" href="https://ai.baidu.com/ai-doc/AISTUDIO/rm344erns" target="_blank" rel="noopener noreferrer">百度 AISTUDIO 官方模型列表</a>{' '}
                查看支持的模型名称。
              </span>
            </li>
            <li>
              <Text strong>自定义提示词：</Text>
              <span> 可选项，用于为模型设定对弈策略或开局偏好，长度最多 200 字符。</span>
            </li>
          </ol>
          <Paragraph className="home-section-tip" type="secondary">
            小提示：建议先在单人模式测试接口可用性，再邀请队友进入房间正式对局。
          </Paragraph>
        </>
      )
    },
    {
      key: 'single',
      className: 'home-slide home-slide--single',
      content: (
        <>
          <Title level={2} className="home-section-title">单人 AI 测试可以做什么？</Title>
          <ul className="home-list">
            <li>与 AI 对弈，逐步确认模型输出的走法，验证策略合理性。</li>
            <li>快速切换不同的 API 配置，对比模型在相同局面下的表现。</li>
            <li>查看棋盘实时状态、落子历史与决策日志，用于调试提示词或参数。</li>
            <li>通过自定义提示词约束模型风格，例如进攻、控局或防守优先。</li>
          </ul>
        </>
      )
    },
    {
      key: 'multi',
      className: 'home-slide home-slide--multi',
      content: (
        <>
          <Title level={2} className="home-section-title">多人对战房间提供哪些功能？</Title>
          <ul className="home-list">
            <li>房主自动分配与转让机制，支持准备状态与配置锁定，防止误操作。</li>
            <li>房主调控执棋颜色（黑/白），但仅限对局开始前且双方未准备完成时。</li>
            <li>轮询同步房间状态，展示双方 AI 配置是否完成整备、剩余修改次数等信息。</li>
            <li>内置战斗日志与聊天消息，便于协同调试、复盘对局。</li>
            <li>支持在房间内执行 AI 思考、确认落子、解散房间等操作。</li>
          </ul>
          <Paragraph className="home-section-tip" type="secondary">
            准备就绪后，点击“执行下一步”触发 AI 决策，确认后正式落子；离开房间时系统会自动交接房主权限。
          </Paragraph>
        </>
      )
    }
  ]

  const totalSlides = slides.length

  const goToSlide = (index: number) => {
    setActiveIndex((index + totalSlides) % totalSlides)
  }

  const handlePrev = () => {
    goToSlide(activeIndex - 1)
  }

  const handleNext = () => {
    goToSlide(activeIndex + 1)
  }

  useEffect(() => {
    const track = sliderTrackRef.current
    const activeSlide = slideRefs.current[activeIndex]
    if (!track || !activeSlide) {
      return
    }

    const trackRect = track.getBoundingClientRect()
    const slideRect = activeSlide.getBoundingClientRect()
    const offset = (slideRect.left - trackRect.left) + slideRect.width / 2 - trackRect.width / 2

    setTrackOffset(offset)
  }, [activeIndex])

  useEffect(() => {
    const handleResize = () => {
      const track = sliderTrackRef.current
      const activeSlide = slideRefs.current[activeIndex]
      if (!track || !activeSlide) {
        return
      }

      const trackRect = track.getBoundingClientRect()
      const slideRect = activeSlide.getBoundingClientRect()
      const offset = (slideRect.left - trackRect.left) + slideRect.width / 2 - trackRect.width / 2
      setTrackOffset(offset)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [activeIndex])

  return (
    <Layout className="home-layout">
      <Navbar />
      <Content className="home-content">
        <main className="home-main">
          <div className="home-slider">
            <div
              className="home-slider-track"
              style={{ transform: `translateX(${-trackOffset}px)` }}
              ref={sliderTrackRef}
            >
              {slides.map((slide, index) => (
                <div
                  key={slide.key}
                  className="home-slide-wrapper"
                  ref={(node) => {
                    slideRefs.current[index] = node
                  }}
                >
                  <section className={slide.className}>
                    {slide.content}
                  </section>
                </div>
              ))}
            </div>

            <div className="home-slider-arrows">
              <Button
                shape="circle"
                size="large"
                icon={<LeftOutlined />}
                onClick={handlePrev}
                aria-label="上一页"
                className="home-slider-arrow home-slider-arrow--prev"
              />
              <Button
                shape="circle"
                size="large"
                icon={<RightOutlined />}
                onClick={handleNext}
                aria-label="下一页"
                className="home-slider-arrow home-slider-arrow--next"
              />
            </div>

            <div className="home-slider-dots" role="tablist" aria-label="首页内容分页">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  className={`home-slider-dot ${index === activeIndex ? 'home-slider-dot--active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`查看第 ${index + 1} 页`}
                  aria-selected={index === activeIndex}
                  role="tab"
                />
              ))}
            </div>
          </div>
        </main>
      </Content>
    </Layout>
  )
}

export default Home