import React from 'react';
import { Heart, Award, Shield, Gift, Github, Mail } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="sub-feature-container">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2 style={{ fontSize: '36px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          🔍 智清大师
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>AI Cleaner Pro</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>版本 1.0.2</p>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #1e3a2f 0%, #2d5a45 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px', textAlign: 'center', textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          🌿 纯绿色 · 无广告 · 无注册 · 完全免费
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <Shield size={40} style={{ marginBottom: '8px', opacity: 0.9 }} />
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>纯绿色软件</p>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>无需安装，即开即用</p>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <Award size={40} style={{ marginBottom: '8px', opacity: 0.9 }} />
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>无广告干扰</p>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>清爽界面，专注功能</p>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <Gift size={40} style={{ marginBottom: '8px', opacity: 0.9 }} />
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>完全免费</p>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>所有功能免费使用</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '15px' }}>
          🏢 开发团队
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <img 
            src="/XiTu-logo.jpg" 
            alt="溪土工作室 Logo" 
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'cover',
              borderRadius: '12px',
              border: '2px solid var(--border-color)'
            }}
          />
          <div>
            <p style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 'bold', margin: '0' }}>
              溪土工作室
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
              荣誉出品
            </p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          致力于为用户提供简洁、高效、免费的系统工具软件
        </p>
      </div>

      <div style={{ 
        background: 'var(--bg-card)',
        padding: '25px',
        borderRadius: '10px',
        marginBottom: '25px',
        border: '1px solid var(--border-light)'
      }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '15px' }}>
          <Heart size={18} style={{ display: 'inline', marginBottom: '3px', color: 'var(--danger-color)' }} />
          {' '}支持我们
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
          如果您觉得软件好用，欢迎请我们喝杯咖啡~
        </p>
        
        <div style={{ 
          border: '2px dashed var(--primary-color)',
          borderRadius: '8px',
          padding: '20px',
          background: 'var(--bg-secondary)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <img 
            src="/QrReward.jpg" 
            alt="赞赏二维码" 
            style={{ 
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              display: 'block',
              margin: '0 auto'
            }}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
            微信扫一扫 支持我们
          </p>
        </div>
      </div>

      <div style={{ 
        marginTop: '25px', 
        padding: '20px', 
        background: 'var(--bg-card)', 
        borderRadius: '8px',
        border: '1px solid var(--border-light)'
      }}>
        <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          📧 联系我们
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          如有任何问题或建议，欢迎联系我们
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <Github size={18} color="var(--text-primary)" />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            溪土工作室：
            <a 
              href="https://github.com/XiTu893" 
              target="_blank" 
              style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
            >
              https://github.com/XiTu893
            </a>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <Mail size={18} color="var(--text-primary)" />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            客服邮箱：<strong style={{ color: 'var(--text-primary)' }}>28491599@qq.com</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
