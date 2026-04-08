import React from 'react';
import { Book, HelpCircle, CheckCircle, ClipboardCheck, Gauge, Shield, Layers, RefreshCw, Trash2, Wrench } from 'lucide-react';

const HelpPage: React.FC = () => {
  const faqs = [
    {
      question: '智清大师是什么软件？',
      answer: '智清大师是一款基于 Electron + React 的综合电脑管理工具，提供硬件检测、性能评测、硬件监控、清理优化、驱动管理、软件管理等多种实用功能。'
    },
    {
      question: '软件需要安装吗？',
      answer: '不需要。智清大师是纯绿色软件，下载后直接运行即可，无需安装，不会在系统中留下任何残留文件。'
    },
    {
      question: '软件完全免费吗？',
      answer: '是的，智清大师完全免费，所有功能都可以免费使用，无任何广告、无注册要求。'
    },
    {
      question: '硬件检测的数据准确吗？',
      answer: '硬件检测功能通过读取系统底层 API 获取真实硬件信息，数据准确可靠。但部分监控数据（如温度）需要硬件传感器支持。'
    },
    {
      question: '清理优化功能安全吗？',
      answer: '清理优化功能会先扫描并列出可清理的项目，由用户确认后再执行清理操作，确保不会误删重要文件。'
    },
    {
      question: '驱动管理如何工作？',
      answer: '驱动管理功能可以检测系统中的驱动程序状态，提供驱动更新建议和备份还原功能，确保系统稳定运行。'
    },
    {
      question: '文件粉碎机真的无法恢复吗？',
      answer: '文件粉碎机使用 DoD 5220.22-M 等标准多次覆盖数据，确保文件无法被恢复。但 SSD 硬盘建议使用专门的安全擦除工具。'
    },
    {
      question: '数据恢复功能支持哪些文件系统？',
      answer: '数据恢复功能支持 NTFS 和 FAT32 文件系统。文件删除后应尽快扫描恢复，避免新数据覆盖。'
    }
  ];

  const features = [
    {
      icon: <ClipboardCheck size={24} color="#3498db" />,
      title: '硬件检测',
      desc: '检测硬件配置、健康状态、真伪验证和屏幕测试'
    },
    {
      icon: <Gauge size={24} color="#9b59b6" />,
      title: '性能评测',
      desc: '整体性能测试、子项测试和性能排行榜'
    },
    {
      icon: <Shield size={24} color="#e67e22" />,
      title: '硬件监控',
      desc: '实时监控温度、压力测试、健康状态和节能降温'
    },
    {
      icon: <Layers size={24} color="#27ae60" />,
      title: '清理优化',
      desc: '垃圾清理、系统优化、C 盘瘦身、桌面整理和内存释放'
    },
    {
      icon: <RefreshCw size={24} color="#1abc9c" />,
      title: '驱动管理',
      desc: '驱动检测更新和驱动备份还原'
    },
    {
      icon: <Trash2 size={24} color="#e74c3c" />,
      title: '软件管理',
      desc: '软件卸载、软件升级和安装包清理'
    },
    {
      icon: <Wrench size={24} color="#34495e" />,
      title: '实用工具',
      desc: '功耗计算器、桌面监控、数据恢复和文件粉碎机'
    }
  ];

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '20px' }}>
          <Book size={20} style={{ display: 'inline', marginRight: '8px' }} />
          功能概览
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          {features.map((feature, index) => (
            <div 
              key={index}
              style={{ 
                padding: '20px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ marginBottom: '12px' }}>{feature.icon}</div>
              <h4 style={{ fontSize: '15px', color: '#2c3e50', marginBottom: '8px' }}>
                {feature.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#7f8c8d', lineHeight: '1.6' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="scan-section" style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '20px' }}>
          <HelpCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
          常见问题
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {faqs.map((faq, index) => (
            <div 
              key={index}
              style={{ 
                padding: '15px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                borderLeft: '4px solid #3498db'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle size={20} color="#27ae60" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '8px' }}>
                    {faq.question}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#7f8c8d', lineHeight: '1.6' }}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tips-section">
        <h4>💡 使用提示</h4>
        <ul>
          <li>首次使用建议先运行"硬件检测"了解系统配置</li>
          <li>定期使用"清理优化"功能保持系统整洁</li>
          <li>更新驱动前建议使用"驱动备份"功能</li>
          <li>如遇到问题可通过"反馈"页面联系我们</li>
          <li>软件为绿色版，可放在 U 盘随身携带</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpPage;
