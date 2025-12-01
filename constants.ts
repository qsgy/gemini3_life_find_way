import { CardData, PlayerStats, CommentaryTemplate } from './types';

export const INITIAL_STATS: PlayerStats = {
  wealth: 50,
  connections: 30,
  achievements: 10,
  energy: 80,
  mood: 80,
};

export const MAX_TURNS = 50;
export const CARDS_TO_DRAW = 5;
export const CARDS_TO_PLAY = 3;

// --- 扩充后的卡牌库 (80+ events) ---
export const CARDS: CardData[] = [
  // 学习类
  { id: 'study_ai', title: '学习 AI 工程', description: '钻研 Transformer 架构。', effects: { achievements: 6, energy: -15, mood: -5 }, type: 'study', emoji: '🤖' },
  { id: 'library', title: '图书馆刷夜', description: '备战期末，通宵达旦。', effects: { achievements: 8, energy: -20, mood: -10 }, type: 'study', emoji: '📚' },
  { id: 'english', title: '备考雅思', description: '为了出国留学做准备。', effects: { achievements: 5, wealth: -10, energy: -10 }, type: 'study', emoji: '🔤' },
  { id: 'math_contest', title: '数学建模大赛', description: '三天三夜如果不死就赢了。', effects: { achievements: 15, energy: -40, mood: -15 }, type: 'study', emoji: '📐' },
  { id: 'lecture', title: '大师讲座', description: '去听诺奖得主的讲座。', effects: { achievements: 3, energy: -5, mood: 5 }, type: 'study', emoji: '🎤' },
  { id: 'scholarship', title: '申请奖学金', description: '填写繁琐的申请表格。', effects: { wealth: 20, energy: -10 }, type: 'study', emoji: '💰' },
  { id: 'skip_class', title: '逃课', description: '这节水课不去也罢。', effects: { energy: 5, achievements: -2 }, type: 'study', emoji: '🚪' },
  { id: 'group_project', title: '小组作业', description: '不仅要干活，还要撕逼。', effects: { achievements: 5, mood: -15, energy: -15 }, type: 'study', emoji: '👥' },
  { id: 'coding', title: '刷 LeetCode', description: '为了进大厂，拼了。', effects: { achievements: 7, energy: -15, mood: -5 }, type: 'study', emoji: '💻' },
  { id: 'thesis', title: '写论文', description: '查重率降不下来啊！', effects: { achievements: 10, energy: -25, mood: -20 }, type: 'study', emoji: '📝' },
  { id: 'lab_work', title: '实验室搬砖', description: '帮师兄洗试管。', effects: { connections: 5, achievements: 4, energy: -20 }, type: 'study', emoji: '🧪' },
  { id: 'online_course', title: '网课考证', description: 'Coursera 证书喜加一。', effects: { achievements: 4, wealth: -5 }, type: 'study', emoji: '🎓' },
  { id: 'reading', title: '阅读经典', description: '在湖边读读哲学。', effects: { achievements: 2, mood: 10, energy: -5 }, type: 'study', emoji: '📖' },
  { id: 'cet6', title: '六级考试', description: '裸考能不能过？', effects: { achievements: 4, energy: -10 }, type: 'study', emoji: '📝' },
  { id: 'exchange', title: '交换生申请', description: '准备复杂的申请材料。', effects: { achievements: 5, energy: -10 }, type: 'study', emoji: '✈️' },
  
  // 工作/搞钱类
  { id: 'part_time_job', title: '送外卖', description: '跑腿赚点生活费。', effects: { wealth: 10, energy: -20, achievements: -1 }, type: 'work', emoji: '🛵' },
  { id: 'tutor', title: '做家教', description: '教熊孩子数学。', effects: { wealth: 15, energy: -15, mood: -5 }, type: 'work', emoji: '👨‍🏫' },
  { id: 'internship', title: '大厂实习', description: '996福报体验卡。', effects: { wealth: 20, achievements: 10, energy: -30, mood: -10 }, type: 'work', emoji: '💼' },
  { id: 'startup', title: '创业项目', description: 'PPT造车，拉投资。', effects: { wealth: -10, achievements: 15, energy: -25 }, type: 'work', emoji: '🚀' },
  { id: 'streamer', title: '兼职主播', description: '虽然没人看，但要坚持。', effects: { wealth: 5, connections: 5, energy: -10 }, type: 'work', emoji: '📹' },
  { id: 'counselor_helper', title: '辅导员助理', description: '处理杂务，换取好感。', effects: { connections: 8, energy: -10, achievements: 2 }, type: 'work', emoji: '📋' },
  { id: 'second_hand', title: '闲鱼倒货', description: '倒卖二手书和电子产品。', effects: { wealth: 8, energy: -5 }, type: 'work', emoji: '📦' },
  { id: 'campus_agent', title: '校园代理', description: '推销电话卡和宽带。', effects: { wealth: 12, connections: -5, energy: -10 }, type: 'work', emoji: '📱' },
  { id: 'photo_gig', title: '约拍接单', description: '给学妹拍写真。', effects: { wealth: 10, connections: 3, energy: -15 }, type: 'work', emoji: '📷' },
  { id: 'program_outsource', title: '接外包', description: '帮人写毕设系统。', effects: { wealth: 25, energy: -25, mood: -10 }, type: 'work', emoji: '⌨️' },

  // 社交类
  { id: 'club', title: '社团招新', description: '百团大战，眼花缭乱。', effects: { connections: 10, energy: -10 }, type: 'social', emoji: '🎪' },
  { id: 'date', title: '甜蜜约会', description: '吃饭逛街看电影。', effects: { mood: 20, wealth: -20, connections: 2 }, type: 'social', emoji: '❤️' },
  { id: 'party', title: '宿舍聚餐', description: '海底捞走起！', effects: { connections: 5, mood: 10, wealth: -15 }, type: 'social', emoji: '🍲' },
  { id: 'student_union', title: '学生会竞选', description: '在那全是人情世故的地方。', effects: { connections: 15, mood: -10, energy: -20 }, type: 'social', emoji: '👔' },
  { id: 'networking', title: '校友酒会', description: '混脸熟，递名片。', effects: { connections: 12, wealth: -10, energy: -10 }, type: 'social', emoji: '🥂' },
  { id: 'volunteer', title: '志愿服务', description: '去敬老院献爱心。', effects: { connections: 5, mood: 15, energy: -15 }, type: 'social', emoji: '🤝' },
  { id: 'confession', title: '表白', description: '在楼下摆蜡烛。', effects: { mood: -20, connections: -5, energy: -10 }, type: 'social', emoji: '🕯️' }, 
  { id: 'blind_date', title: '联谊', description: '和其他宿舍的联谊活动。', effects: { connections: 8, wealth: -10, mood: 5 }, type: 'social', emoji: '👫' },
  { id: 'gossip', title: '吃瓜', description: '在表白墙看八卦。', effects: { mood: 5, energy: -5 }, type: 'social', emoji: '🍉' },
  { id: 'team_building', title: '班级团建', description: '尴尬的破冰游戏。', effects: { connections: 6, wealth: -5, energy: -10 }, type: 'social', emoji: '🚌' },

  // 娱乐类
  { id: 'gaming', title: '通宵开黑', description: '今晚王者，不赢不睡。', effects: { mood: 15, energy: -25, achievements: -2 }, type: 'leisure', emoji: '🎮' },
  { id: 'sleep', title: '睡懒觉', description: '直接睡到下午两点。', effects: { energy: 25, achievements: -5, mood: 5 }, type: 'leisure', emoji: '😴' },
  { id: 'travel', title: '特种兵旅游', description: '24小时打卡8个景点。', effects: { mood: 20, wealth: -25, energy: -30 }, type: 'leisure', emoji: '🚆' },
  { id: 'concert', title: '音乐节', description: '蹦迪，在泥地里狂欢。', effects: { mood: 25, wealth: -30, energy: -20 }, type: 'leisure', emoji: '🎸' },
  { id: 'gym', title: '健身房', description: '只有身体是革命的本钱。', effects: { energy: 10, mood: 5, wealth: -5 }, type: 'leisure', emoji: '💪' },
  { id: 'drama', title: '追剧', description: '一口气看完一整季。', effects: { mood: 10, energy: -10, achievements: -1 }, type: 'leisure', emoji: '📺' },
  { id: 'shopping', title: '疯狂购物', description: '双十一剁手。', effects: { mood: 15, wealth: -30 }, type: 'leisure', emoji: '🛍️' },
  { id: 'ktv', title: 'KTV通宵', description: '嘶吼到天亮。', effects: { mood: 12, wealth: -15, energy: -20 }, type: 'leisure', emoji: '🎤' },
  { id: 'billiards', title: '打台球', description: '优雅的休闲运动。', effects: { mood: 8, wealth: -5 }, type: 'leisure', emoji: '🎱' },
  { id: 'internet_cafe', title: '网吧包夜', description: '怀念的感觉。', effects: { mood: 10, wealth: -5, energy: -25 }, type: 'leisure', emoji: '💻' },
  { id: 'walk', title: '操场散步', description: '听着歌，绕圈圈。', effects: { mood: 5, energy: 5 }, type: 'leisure', emoji: '🚶' },

  // 随机事件/特殊类
  { id: 'loan', title: '校园贷', description: '借钱一时爽...千万别碰！', effects: { wealth: 50, mood: -30, connections: -20 }, type: 'event', emoji: '💸' },
  { id: 'illness', title: '生病发烧', description: '在宿舍躺尸三天。', effects: { energy: -30, mood: -10, wealth: -5 }, type: 'event', emoji: '🤒' },
  { id: 'lost_phone', title: '丢手机', description: '心情跌落谷底。', effects: { wealth: -40, mood: -20 }, type: 'event', emoji: '📱' },
  { id: 'winning', title: '中彩票', description: '运气爆棚！', effects: { wealth: 30, mood: 20 }, type: 'event', emoji: '🎟️' },
  { id: 'fail_exam', title: '挂科', description: '不得不重修。', effects: { achievements: -10, mood: -15 }, type: 'event', emoji: '❌' },
  { id: 'cat', title: '撸猫', description: '遇到校园里的流浪猫。', effects: { mood: 10, energy: -2 }, type: 'event', emoji: '🐱' },
];

// --- 辅导员台词模板库 ---
export const COMMENTARY_TEMPLATES: CommentaryTemplate[] = [
  // 极端状态 - 贫穷
  {
    condition: (s) => s.wealth < 10,
    lines: [
      "同学，我看你最近是不是在吃土？要不要考虑去食堂勤工俭学？",
      "你的钱包比我的脸还干净，最近还是少点社交活动吧。",
      "经济危机预警！建议这周开启‘生存模式’，别乱花钱了。",
      "再不赚钱，你可能连论文打印费都交不起了。"
    ]
  },
  // 极端状态 - 抑郁
  {
    condition: (s) => s.mood < 20,
    lines: [
      "我看你印堂发黑，最近是不是压力太大了？去操场跑两圈吧。",
      "心理健康很重要！不要硬撑，实在不行来办公室找我聊聊。",
      "别太逼自己了，大学生活不只有学习，开心最重要。",
      "状态不对劲啊，建议这周去撸个猫或者睡个懒觉回回血。"
    ]
  },
  // 极端状态 - 疲劳
  {
    condition: (s) => s.energy < 20,
    lines: [
      "你是打算修仙吗？再不睡觉，猝死新闻主角就是你。",
      "身体是革命的本钱，我看你随时会在课上晕倒。",
      "少熬夜！少熬夜！少熬夜！重要的事情说三遍。",
      "你的黑眼圈已经掉到下巴了，赶紧去休息！"
    ]
  },
  // 行为 - 沉迷学习 (本回合选了2张以上学习卡)
  {
    condition: (_, cards) => cards.filter(c => c.type === 'study').length >= 2,
    lines: [
      "这么爱学习？保研稳了啊！但也别学傻了。",
      "这就是传说中的卷王吗？图书馆是你家开的？",
      "学霸人设屹立不倒，记得劳逸结合，别把身体搞垮了。",
      "我看好你拿国奖，但这周是不是有点太拼了？"
    ]
  },
  // 行为 - 沉迷玩乐 (本回合选了2张以上娱乐卡)
  {
    condition: (_, cards) => cards.filter(c => c.type === 'leisure').length >= 2,
    lines: [
      "玩得挺嗨啊？期末考试准备得怎么样了？",
      "大学生活确实自由，但也不能天天这么浪吧？",
      "小心挂科预警！玩归玩，书还是要看的。",
      "你这周过得挺滋润嘛，辅导员我都羡慕了。"
    ]
  },
  // 行为 - 疯狂搞钱 (本回合选了2张以上工作卡)
  {
    condition: (_, cards) => cards.filter(c => c.type === 'work').length >= 2,
    lines: [
      "掉钱眼里了？虽然赚钱重要，但学业才是主业啊。",
      "年纪轻轻就这么有商业头脑，以后苟富贵勿相忘。",
      "打工皇帝是你吗？注意身体，别累坏了。",
      "这么拼命赚钱，是打算在这个城市买房吗？"
    ]
  },
  // 行为 - 社交达人 (本回合选了2张以上社交卡)
  {
    condition: (_, cards) => cards.filter(c => c.type === 'social').length >= 2,
    lines: [
      "交际花就是你吧？全校就没有你不认识的人。",
      "人脉确实重要，但无效社交也很浪费时间哦。",
      "天天聚会，钱包受得了吗？肝受得了吗？",
      "我看你这周主要任务就是混脸熟啊。"
    ]
  },
  // 默认/平衡
  {
    condition: () => true,
    lines: [
      "这周安排得中规中矩，继续保持。",
      "大学生活就是要多尝试，你的选择很有意思。",
      "看起来你已经适应了大学的节奏，不错。",
      "这就是丰富多彩的大学生活啊，加油！",
      "只要不挂科，怎么过都是精彩的一周。",
      "你的选择决定了你的未来，但这周过得开心就好。"
    ]
  }
];

// --- 辅导员锦囊 (Advice) ---
export const ADVICE_DB = [
  "大一不迷茫，大二不彷徨。现在多尝试，以后少后悔。",
  "奖学金不仅看成绩，综测也很重要，多参加点活动没坏处。",
  "不要为了合群而合群，低质量的社交不如高质量的独处。",
  "谈恋爱是大学的必修课，但不是全部，别恋爱脑。",
  "期末考试前两周是创造奇迹的时间，别放弃！",
  "身体不舒服就请假，辅导员我还是通情达理的。",
  "多去图书馆，那里有你意想不到的机遇（和空调）。",
  "学会理财，不要每个月月底都吃泡面。",
  "室友关系要搞好，毕竟要在一起住四年。",
  "如果感到迷茫，就去跑步，运动能分泌多巴胺。",
  "英语真的很重要，四六级尽早过，别拖到大四。",
  "有空多回家看看，或者给爸妈打个视频电话。"
];
