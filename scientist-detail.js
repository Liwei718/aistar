const scientistProfiles = {
  newton: {
    name: "牛顿",
    category: "物理学家",
    avatarClass: "avatar-newton",
    fallback: "牛",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_Sir_Isaac_Newton%2C_1689.jpg?width=360",
    summary: "他把自然界的运动变成可以计算、可以预测的规律。",
    story:
      "牛顿生活在十七世纪。他最重要的地方，不只是发现了某一个现象，而是把地面上的运动、天上的月亮和行星，都放进同一套数学规律里。这样一来，人们不再只是观察自然，还能用公式去解释和预测自然。",
    contributions: ["提出经典力学三大运动定律", "建立万有引力理论", "推动微积分和光学研究的发展"],
    explanation:
      "可以把牛顿的贡献理解成：他给自然界写了一套“运动说明书”。如果知道物体受了什么力、质量是多少、速度怎样变化，就能推算它之后会怎样运动。课本里的力、速度、加速度和函数图像，都能在这里找到影子。",
    knowledge: ["力与运动", "万有引力", "速度和加速度", "函数图像"],
    question: "为什么苹果会下落，月亮却没有直接掉到地球上？",
    inspiration: "遇到复杂现象时，可以先找共同规律，再用数学语言把规律表达清楚。"
  },
  einstein: {
    name: "爱因斯坦",
    category: "物理学家",
    avatarClass: "avatar-einstein",
    fallback: "爱",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Einstein_1921_portrait2.jpg?width=360",
    summary: "他重新解释了时间、空间、光和引力。",
    story:
      "爱因斯坦喜欢追问最基础的问题：如果我和光一起奔跑，会看到什么？这样的想象帮助他提出相对论。相对论告诉我们，时间和空间不是完全固定的，它们会和速度、引力发生关系。",
    contributions: ["提出狭义相对论和广义相对论", "解释光电效应", "推动现代物理学发展"],
    explanation:
      "在日常生活中，时间好像对所有人都一样。但当速度接近光速，或者引力特别强时，时间和空间会出现不同表现。中小学生先不用急着推公式，可以先理解：科学有时需要敢于怀疑“看起来理所当然”的事情。",
    knowledge: ["光和速度", "宇宙观测", "能量", "科学假设"],
    question: "如果速度非常非常快，时间还会像平时一样流动吗？",
    inspiration: "真正深的问题，常常来自对普通现象的认真追问。"
  },
  curie: {
    name: "玛丽·居里",
    category: "物理学家",
    avatarClass: "avatar-curie",
    fallback: "居",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_Marie_Curie.jpg?width=360",
    summary: "她通过长期实验揭开了放射性的秘密。",
    story:
      "玛丽·居里长期研究一些会自己释放能量的物质。她和皮埃尔·居里一起发现了钋和镭，也让人们认识到原子内部并不是简单、安静的结构，而可能含有巨大的能量。",
    contributions: ["研究放射性现象", "发现钋和镭", "推动原子物理和医学应用"],
    explanation:
      "她的工作说明：科学发现不只靠灵感，也靠大量、耐心、精确的实验。放射性就像物质内部不断发出的信号，科学家通过测量这些信号，逐步理解原子的内部结构。",
    knowledge: ["物质结构", "能量转化", "实验测量", "安全意识"],
    question: "如果一种物质自己会释放能量，我们怎样安全地研究它？",
    inspiration: "严谨记录、反复测量和长期坚持，是实验科学最重要的能力。"
  },
  euclid: {
    name: "欧几里得",
    category: "数学家",
    avatarClass: "avatar-euclid",
    fallback: "欧",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_Euclid_Wellcome_L0019815.jpg?width=360",
    summary: "他把几何整理成清晰的公理和证明体系。",
    story:
      "欧几里得最有名的作品是《几何原本》。他把很多零散的几何知识组织起来：先给出少数基础规则，再一步一步推出新的结论。这种方法影响了两千多年的数学学习。",
    contributions: ["整理平面几何体系", "建立公理化表达方式", "训练数学证明思维"],
    explanation:
      "欧几里得的几何像搭积木：先有最基本的积木块，再按照清楚的规则搭出复杂结构。学习图形、角、三角形和证明时，其实就在使用这种思考方式。",
    knowledge: ["图形认识", "角和三角形", "证明", "逻辑推理"],
    question: "为什么数学证明不能只说“看起来是这样”？",
    inspiration: "清楚的前提、严密的步骤，比单纯记答案更重要。"
  },
  gauss: {
    name: "高斯",
    category: "数学家",
    avatarClass: "avatar-gauss",
    fallback: "高",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Carl_Friedrich_Gauss.jpg?width=360",
    summary: "他在数论、统计、几何和天文学中都有深远贡献。",
    story:
      "高斯从小就显示出强大的数学能力。他研究的问题非常广，从整数的规律到误差分析，从几何到天体轨道，都有重要成果，因此被称为“数学王子”。",
    contributions: ["发展数论", "研究最小二乘法和误差分析", "推动几何和天文学计算"],
    explanation:
      "高斯的贡献可以理解为：他非常擅长从数字中发现隐藏结构。比如一组数据有误差，怎样找到最合理的结果？一串数字看似杂乱，是否藏着规律？这些问题今天仍然很重要。",
    knowledge: ["数列", "统计", "误差", "数学建模"],
    question: "面对有误差的数据，怎样找到最接近真实情况的答案？",
    inspiration: "数学不只是算得快，更是看见规律、建立模型。"
  },
  "hua-luogeng": {
    name: "华罗庚",
    category: "数学家",
    avatarClass: "avatar-hua",
    fallback: "华",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Hua_Luogeng_1956.jpg?width=360",
    summary: "他推动中国数学研究，也重视数学在生活和生产中的应用。",
    story:
      "华罗庚是中国重要数学家。他既做深入的数学研究，也努力把数学方法带到实际问题里，比如怎样安排生产、怎样优化流程，让数学真正帮助现实生活。",
    contributions: ["研究数论和多复变函数", "推动中国现代数学发展", "推广优选法和统筹法"],
    explanation:
      "他的故事适合帮助学生理解：数学不是只在试卷上出现。优化路线、安排时间、节省材料，这些都可以用数学方法改进。数学能把“凭感觉做事”变成“有依据地选择”。",
    knowledge: ["数论", "优化", "统筹安排", "数学应用"],
    question: "如果时间和资源都有限，怎样安排才能更高效？",
    inspiration: "学数学既要追求严谨，也要关心它能解决什么真实问题。"
  },
  turing: {
    name: "艾伦·图灵",
    category: "AI 学家",
    avatarClass: "avatar-turing",
    fallback: "图",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Alan_Turing_Aged_16.jpg?width=360",
    summary: "他提出计算模型，也提出机器能否思考的问题。",
    story:
      "图灵是计算机科学的重要奠基者。他思考“什么是可计算的”，并提出一种抽象机器模型。后来，他还提出关于机器智能的著名问题，影响了人工智能的发展。",
    contributions: ["提出图灵机模型", "参与密码破译工作", "提出机器智能相关思想"],
    explanation:
      "图灵机可以想成一台特别简单但规则清楚的机器：它读取符号、按照规则改变符号、再移动到下一步。这个模型帮助人们理解算法的本质，也让计算机科学有了坚实基础。",
    knowledge: ["算法", "逻辑判断", "程序步骤", "人工智能"],
    question: "如果一个问题可以拆成明确步骤，机器是不是就能完成它？",
    inspiration: "把大问题拆成清楚规则，是学习编程和 AI 的起点。"
  },
  mccarthy: {
    name: "约翰·麦卡锡",
    category: "AI 学家",
    avatarClass: "avatar-mccarthy",
    fallback: "麦",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/John_McCarthy_Stanford.jpg?width=360",
    summary: "他提出“人工智能”这个名称，推动 AI 成为独立学科。",
    story:
      "约翰·麦卡锡是人工智能领域的重要奠基者之一。他推动科学家们正式讨论：能不能让机器表现出类似人类智能的能力？他还设计了 Lisp 语言，影响了早期 AI 研究。",
    contributions: ["提出人工智能概念", "组织早期 AI 研究", "发明 Lisp 编程语言"],
    explanation:
      "他的贡献像是给一个新学科点亮了名字和方向。AI 不只是让机器算得快，而是研究怎样表示知识、推理问题、规划行动，并用程序实现这些能力。",
    knowledge: ["符号推理", "编程语言", "问题求解", "知识表示"],
    question: "机器要解决问题，应该先怎样“表示”这个问题？",
    inspiration: "给新问题命名、建立共同语言，本身就是创造学科的重要一步。"
  },
  hinton: {
    name: "杰弗里·辛顿",
    category: "AI 学家",
    avatarClass: "avatar-hinton",
    fallback: "辛",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Geoffrey_Hinton_at_UBC_%28cropped%29.jpg?width=360",
    summary: "他推动神经网络和深度学习走向突破。",
    story:
      "辛顿长期研究神经网络。在一段时间里，很多人并不看好这种方法，但他持续推进。后来，随着数据和计算能力提升，深度学习在图像、语音和语言任务中取得重要突破。",
    contributions: ["推动反向传播和神经网络研究", "发展深度学习方法", "影响现代 AI 应用"],
    explanation:
      "神经网络可以粗略理解成很多小计算单元连接在一起，通过大量样本调整连接强弱。它不是手写所有规则，而是从数据中学习模式。今天的图像识别、语音识别和大语言模型，都和这种思想有关。",
    knowledge: ["数据训练", "模式识别", "神经网络", "人工智能应用"],
    question: "如果不直接告诉机器规则，机器能不能从例子里学会规律？",
    inspiration: "一个方向暂时不被看好时，持续验证和改进也可能带来真正突破。"
  }
};

const params = new URLSearchParams(window.location.search);
const scientistId = params.get("id") || "newton";
const profile = scientistProfiles[scientistId] || scientistProfiles.newton;

document.title = `${profile.name} · 科学人物讲解`;

const setText = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
};

const renderList = (id, items) => {
  const list = document.getElementById(id);
  if (!list) return;
  list.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
};

const photo = document.getElementById("detail-photo");
if (photo) {
  photo.className = `scientist-detail-photo scientist-avatar ${profile.avatarClass}`;
  photo.innerHTML = `
    <b aria-hidden="true">${profile.fallback}</b>
    <img src="${profile.image}" alt="${profile.name}头像" loading="lazy" onerror="this.hidden=true" />
  `;
}

setText("detail-category", profile.category);
setText("detail-name", profile.name);
setText("detail-summary", profile.summary);
setText("detail-story", profile.story);
setText("detail-explanation", profile.explanation);
setText("detail-question", profile.question);
setText("detail-inspiration", profile.inspiration);
renderList("detail-contributions", profile.contributions);
renderList("detail-knowledge", profile.knowledge);
