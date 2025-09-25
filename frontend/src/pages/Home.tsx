import { Layout, Typography, Card, Row, Col } from 'antd'
import Navbar from '../components/Navbar'
import './Home.css'

const { Content } = Layout
const { Title, Paragraph } = Typography
const { Meta } = Card

function Home() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Navbar />
      <Content style={{ flex: 1, padding: '50px 80px', background: '#f0f2f5', overflow: 'auto' }}>
        <div style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <Title level={1}>五子棋AI对战平台</Title>
            <Paragraph style={{ fontSize: '18px', color: '#666' }}>
              一个支持多个AI模型对战的五子棋平台
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{
                    height: '120px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Title level={2} style={{ color: 'white', margin: 0 }}>🤖</Title>
                  </div>
                }
              >
                <Meta
                  title="多AI支持"
                  description="支持任何兼容OpenAI API格式的服务，包括百度文心一言、ChatGPT等"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{
                    height: '120px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Title level={2} style={{ color: 'white', margin: 0 }}>⚡</Title>
                  </div>
                }
              >
                <Meta
                  title="实时对战"
                  description="逐步观察AI的决策过程，支持手动控制每一步对战"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{
                    height: '120px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Title level={2} style={{ color: 'white', margin: 0 }}>⚙️</Title>
                  </div>
                }
              >
                <Meta
                  title="自定义配置"
                  description="灵活配置API URL、Key和模型，适应不同AI服务提供商"
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  )
}

export default Home