import React, { useState } from 'react';
import { MessageCircle, Send, Mail, User, FileText } from 'lucide-react';

const FeedbackPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'suggestion',
    subject: '',
    content: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.content) {
      alert('请填写必填项');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      alert('✅ 反馈提交成功！\n\n我们会尽快查看并回复您。\n感谢您的支持！');
      setFormData({ name: '', email: '', type: 'suggestion', subject: '', content: '' });
      setSubmitted(false);
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="sub-feature-container">
      <div className="scan-section">
        <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '20px' }}>
          <MessageCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
          在线反馈
        </h3>
        <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '25px' }}>
          如有任何问题、建议或发现 Bug，欢迎通过以下表单联系我们
        </p>

        {submitted ? (
          <div style={{ 
            padding: '30px', 
            textAlign: 'center', 
            background: '#e8f8f5', 
            borderRadius: '8px' 
          }}>
            <Send size={48} color="#27ae60" style={{ marginBottom: '15px' }} />
            <h4 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '10px' }}>
              正在提交反馈...
            </h4>
            <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
              请稍候，我们正在处理您的反馈
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#2c3e50', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  <User size={16} style={{ display: 'inline', marginRight: '5px' }} />
                  称呼 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="您的称呼"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#2c3e50', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  <Mail size={16} style={{ display: 'inline', marginRight: '5px' }} />
                  邮箱 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="您的邮箱（用于回复）"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#2c3e50', 
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                <FileText size={16} style={{ display: 'inline', marginRight: '5px' }} />
                反馈类型
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: 'white',
                }}
              >
                <option value="suggestion">功能建议</option>
                <option value="bug">Bug 反馈</option>
                <option value="question">使用问题</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#2c3e50', 
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                主题
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="反馈主题（可选）"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#2c3e50', 
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                详细内容 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="请详细描述您的问题或建议..."
                required
                rows={8}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              style={{ 
                justifyContent: 'center',
                padding: '12px 30px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <Send size={18} />
              提交反馈
            </button>
          </form>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          background: '#e8f4f8', 
          borderRadius: '8px' 
        }}>
          <h4 style={{ fontSize: '15px', color: '#2c3e50', marginBottom: '10px' }}>
            📧 邮箱联系
          </h4>
          <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '8px' }}>
            也可以通过邮箱直接联系我们
          </p>
          <p style={{ fontSize: '14px', color: '#3498db', fontWeight: '600' }}>
            28491599@qq.com
          </p>
        </div>

        <div style={{ 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '8px' 
        }}>
          <h4 style={{ fontSize: '15px', color: '#2c3e50', marginBottom: '10px' }}>
            💬 响应时间
          </h4>
          <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '8px' }}>
            我们会在 1-3 个工作日内回复
          </p>
          <p style={{ fontSize: '13px', color: '#27ae60', fontWeight: '500' }}>
            紧急问题请尽快联系
          </p>
        </div>

        <div style={{ 
          padding: '20px', 
          background: '#fef9e7', 
          borderRadius: '8px' 
        }}>
          <h4 style={{ fontSize: '15px', color: '#2c3e50', marginBottom: '10px' }}>
            📝 反馈须知
          </h4>
          <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '8px' }}>
            请提供详细的问题描述和截图
          </p>
          <p style={{ fontSize: '13px', color: '#f39c12', fontWeight: '500' }}>
            有助于我们快速定位问题
          </p>
        </div>
      </div>

      <div className="tips-section">
        <h4>💡 反馈建议</h4>
        <ul>
          <li>描述问题时请提供详细的操作步骤和截图</li>
          <li>建议说明系统版本、硬件配置等信息</li>
          <li>如是 Bug 反馈，请提供复现方法</li>
          <li>功能建议请说明具体使用场景</li>
          <li>我们会认真查看每一条反馈</li>
        </ul>
      </div>
    </div>
  );
};

export default FeedbackPage;
