import React from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const BenchmarkRank: React.FC = () => {
  const mockRanks = [
    { rank: 1, name: '华硕玩家国度', score: 15680, percent: 100 },
    { rank: 2, name: '联想拯救者 Y9000P', score: 14920, percent: 95 },
    { rank: 3, name: '戴尔 XPS 15', score: 14250, percent: 91 },
    { rank: 4, name: '惠普暗影精灵 9', score: 13890, percent: 89 },
    { rank: 5, name: 'MacBook Pro 16"', score: 13560, percent: 86 },
    { rank: 6, name: 'ThinkPad X1 Carbon', score: 12980, percent: 83 },
    { rank: 7, name: '戴尔灵越 15', score: 12450, percent: 79 },
    { rank: 8, name: '惠普战 66', score: 11890, percent: 76 },
    { rank: 9, name: '联想小新 Pro 16', score: 11320, percent: 72 },
    { rank: 10, name: '宏碁暗影骑士', score: 10780, percent: 69 },
  ];

  const userScore = 9500;
  const userRank = 156;
  const totalUsers = 10000;

  return (
    <div>
      {/* 用户排名 */}
      <div className="card" style={{ textAlign: 'center', padding: '30px 20px', marginBottom: '25px' }}>
        <Award size={64} color="#f39c12" style={{ marginBottom: '15px' }} />
        <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '10px' }}>您的性能排名</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3498db' }}>{userRank}</div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>当前排名</div>
          </div>
          <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>{userScore.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>您的得分</div>
          </div>
          <div style={{ borderLeft: '2px solid #ecf0f1', paddingLeft: '30px' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e74c3c' }}>{totalUsers.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>参与用户</div>
          </div>
        </div>
        <div style={{ marginTop: '20px', padding: '10px', background: '#e8f4f8', borderRadius: '6px', display: 'inline-block' }}>
          <TrendingUp size={16} style={{ display: 'inline', marginRight: '5px' }} />
          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>超越 {((1 - userRank / totalUsers) * 100).toFixed(1)}% 的用户</span>
        </div>
      </div>

      {/* 排行榜 */}
      <div className="card">
        <div className="card-title">
          <Trophy size={20} />
          性能排行榜 TOP 10
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mockRanks.map((item, index) => (
            <div
              key={item.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                background: index < 3 ? '#fff8e1' : '#f8f9fa',
                borderRadius: '8px',
                borderLeft: index < 3 ? '4px solid #f1c40f' : '4px solid transparent',
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: index === 0 ? '#f1c40f' : index === 1 ? '#bdc3c7' : index === 2 ? '#cd7f32' : '#ecf0f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: index < 3 ? '#fff' : '#7f8c8d',
                marginRight: '15px'
              }}>
                {item.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{item.name}</div>
                <div style={{ height: '6px', background: '#ecf0f1', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: index < 3 ? '#f1c40f' : '#3498db',
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>{item.score.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#95a5a6' }}>分</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提升建议 */}
      <div className="card" style={{ marginTop: '25px' }}>
        <div className="card-title">
          <Medal size={20} />
          性能提升建议
        </div>
        <div style={{ lineHeight: '2.2', color: '#7f8c8d' }}>
          <p>• <strong style={{ color: '#2c3e50' }}>升级硬件：</strong>增加内存容量、更换 SSD 硬盘可显著提升性能</p>
          <p>• <strong style={{ color: '#2c3e50' }}>清理优化：</strong>定期清理系统垃圾，释放磁盘空间</p>
          <p>• <strong style={{ color: '#2c3e50' }}>更新驱动：</strong>保持显卡、主板驱动为最新版本</p>
          <p>• <strong style={{ color: '#2c3e50' }}>散热维护：</strong>清理灰尘，确保良好散热避免降频</p>
          <p>• <strong style={{ color: '#2c3e50' }}>启动项管理：</strong>禁用不必要的开机启动项</p>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkRank;
