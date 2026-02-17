/**
 * Offline Chinese Kinship Title Calculator
 * 
 * This engine resolves Chinese kinship titles from a chain of relationship steps.
 * It models relationships as graph traversals from "self" (我) through
 * relative nodes like 爸爸, 媽媽, 哥哥, etc.
 * 
 * Each person is represented as a "position" with:
 *   - generation (0 = self, +1 = parent, -1 = child, etc.)
 *   - gender ('M' | 'F')
 *   - lineage ('paternal' | 'maternal' | 'self' | 'spouse')
 *   - seniority ('elder' | 'younger' | 'unknown') relative to the linking person
 *   - married (boolean, whether this person is a spouse link)
 */

interface PersonPosition {
  generation: number;
  gender: 'M' | 'F';
  lineage: 'paternal' | 'maternal' | 'self' | 'spouse';
  seniority: 'elder' | 'younger' | 'unknown';
  isSpouseOf?: PersonPosition;
  pathDescription: string[];
}

// ─── Step Resolver ────────────────────────────────────────────────────────
// Given a current position and a step label, compute the new position

function resolveStep(current: PersonPosition, step: string): PersonPosition {
  const desc = [...current.pathDescription];

  switch (step) {
    case '爸爸':
      return {
        generation: current.generation + 1,
        gender: 'M',
        lineage: current.generation === 0 && current.lineage === 'self' ? 'paternal' : current.lineage,
        seniority: 'unknown',
        pathDescription: [...desc, '父親'],
      };
    case '媽媽':
      return {
        generation: current.generation + 1,
        gender: 'F',
        lineage: current.generation === 0 && current.lineage === 'self' ? 'maternal' : current.lineage,
        seniority: 'unknown',
        pathDescription: [...desc, '母親'],
      };
    case '哥哥':
      return {
        generation: current.generation,
        gender: 'M',
        lineage: current.lineage,
        seniority: 'elder',
        pathDescription: [...desc, '兄'],
      };
    case '姊姊':
      return {
        generation: current.generation,
        gender: 'F',
        lineage: current.lineage,
        seniority: 'elder',
        pathDescription: [...desc, '姊'],
      };
    case '弟弟':
      return {
        generation: current.generation,
        gender: 'M',
        lineage: current.lineage,
        seniority: 'younger',
        pathDescription: [...desc, '弟'],
      };
    case '妹妹':
      return {
        generation: current.generation,
        gender: 'F',
        lineage: current.lineage,
        seniority: 'younger',
        pathDescription: [...desc, '妹'],
      };
    case '兒子':
      return {
        generation: current.generation - 1,
        gender: 'M',
        lineage: current.lineage,
        seniority: 'unknown',
        pathDescription: [...desc, '子'],
      };
    case '女兒':
      return {
        generation: current.generation - 1,
        gender: 'F',
        lineage: current.lineage,
        seniority: 'unknown',
        pathDescription: [...desc, '女'],
      };
    case '丈夫':
      return {
        generation: current.generation,
        gender: 'M',
        lineage: current.lineage === 'self' ? 'spouse' : current.lineage,
        seniority: current.seniority,
        isSpouseOf: current,
        pathDescription: [...desc, '夫'],
      };
    case '妻子':
      return {
        generation: current.generation,
        gender: 'F',
        lineage: current.lineage === 'self' ? 'spouse' : current.lineage,
        seniority: current.seniority,
        isSpouseOf: current,
        pathDescription: [...desc, '妻'],
      };
    case '爺爺':
      return {
        generation: current.generation + 2,
        gender: 'M',
        lineage: 'paternal',
        seniority: 'unknown',
        pathDescription: [...desc, '祖父'],
      };
    case '奶奶':
      return {
        generation: current.generation + 2,
        gender: 'F',
        lineage: 'paternal',
        seniority: 'unknown',
        pathDescription: [...desc, '祖母'],
      };
    case '外公':
      return {
        generation: current.generation + 2,
        gender: 'M',
        lineage: 'maternal',
        seniority: 'unknown',
        pathDescription: [...desc, '外祖父'],
      };
    case '外婆':
      return {
        generation: current.generation + 2,
        gender: 'F',
        lineage: 'maternal',
        seniority: 'unknown',
        pathDescription: [...desc, '外祖母'],
      };
    default:
      return { ...current, pathDescription: [...desc, step] };
  }
}

// ─── Path-Based Lookup ────────────────────────────────────────────────────
// We use a comprehensive lookup table mapping path strings to titles.
// This is the most reliable approach for Chinese kinship which has
// many irregular/cultural-specific titles.

interface KinshipResult {
  title: string;
  explanation: string;
}

// Build a comprehensive lookup map from path strings -> results
const PATH_LOOKUP: Record<string, KinshipResult> = {};

function addPath(path: string[], title: string, explanation: string) {
  PATH_LOOKUP[path.join('→')] = { title, explanation };
}

// ═══════════════════════════════════════════════════════════════
// SELF
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// GENERATION +1 (Parents)
// ═══════════════════════════════════════════════════════════════
addPath(['爸爸'], '爸爸', '父親，是家庭中的重要支柱。在傳統宗法制度中，父親代表著家族的延續與傳承，是「五服」親屬關係的核心起點。');
addPath(['媽媽'], '媽媽', '母親，是家庭中最溫暖的存在。俗話說「娘親舅大」，母親的娘家在傳統禮俗中有著重要的地位。');

// ═══════════════════════════════════════════════════════════════
// GENERATION +2 (Grandparents)
// ═══════════════════════════════════════════════════════════════
addPath(['爺爺'], '爺爺', '祖父，父親的父親。在宗法制度中，祖父是家族中的長輩核心，代表著家族的根源與傳承。');
addPath(['奶奶'], '奶奶', '祖母，父親的母親。在家庭中扮演著慈愛的角色，是連結家族情感的重要紐帶。');
addPath(['外公'], '外公', '外祖父，母親的父親。傳統上屬於「外親」，但在現代社會中同樣受到尊敬和愛戴。');
addPath(['外婆'], '外婆', '外祖母，母親的母親。俗語說「外婆疼外孫」，體現了跨代的深厚親情。');
addPath(['爸爸', '爸爸'], '爺爺', '祖父，父親的父親。在宗法制度中，祖父是家族輩分的基準點，同輩中的排行也由此展開。');
addPath(['爸爸', '媽媽'], '奶奶', '祖母，父親的母親。傳統上稱為「祖母」或「奶奶」，在家族中地位尊崇。');
addPath(['媽媽', '爸爸'], '外公', '外祖父，母親的父親。俗稱「外公」或「姥爺」（北方），是母系家族的長輩。');
addPath(['媽媽', '媽媽'], '外婆', '外祖母，母親的母親。俗稱「外婆」或「姥姥」（北方），是母系家族中慈愛的代表。');

// ═══════════════════════════════════════════════════════════════
// GENERATION +3 (Great-grandparents)  
// ═══════════════════════════════════════════════════════════════
addPath(['爺爺', '爸爸'], '曾祖父', '曾祖父，即祖父的父親、父親的祖父。在「五服」制度中屬於「齊衰」服，是家族中極受尊崇的先祖。');
addPath(['爺爺', '媽媽'], '曾祖母', '曾祖母，即祖父的母親。在傳統家族中，曾祖母代表著家族歷史的見證者。');
addPath(['奶奶', '爸爸'], '曾外祖父', '曾外祖父，即祖母的父親。反映了傳統婚姻聯盟中的家族關係。');
addPath(['奶奶', '媽媽'], '曾外祖母', '曾外祖母，即祖母的母親。屬於較遠的姻親長輩。');
addPath(['外公', '爸爸'], '外曾祖父', '外曾祖父，母親的祖父。在傳統社會中屬於外親中的高輩長者。');
addPath(['外公', '媽媽'], '外曾祖母', '外曾祖母，母親的祖母。在家族祭祀中雖屬外親但同樣受到尊敬。');

// ═══════════════════════════════════════════════════════════════
// SIBLINGS (Generation 0)
// ═══════════════════════════════════════════════════════════════
addPath(['哥哥'], '哥哥', '兄長，同父同母的年長男性兄弟。「長兄如父」，在傳統家庭中兄長往往承擔著照顧弟妹的責任。');
addPath(['姊姊'], '姊姊', '姊姊，同父同母的年長女性姊妹。在家庭中是弟妹的依靠，傳統上也是家庭和睦的重要力量。');
addPath(['弟弟'], '弟弟', '弟弟，同父同母的年幼男性兄弟。「友愛弟恭」是儒家重視的兄弟之道。');
addPath(['妹妹'], '妹妹', '妹妹，同父同母的年幼女性姊妹。兄妹之間的情誼在傳統文化中被視為珍貴的手足之情。');

// ═══════════════════════════════════════════════════════════════
// SPOUSE (Generation 0)
// ═══════════════════════════════════════════════════════════════
addPath(['丈夫'], '丈夫', '丈夫，也稱「夫君」、「先生」。傳統婚姻中「夫為妻綱」，現代社會則強調夫妻平等互敬。');
addPath(['妻子'], '妻子', '妻子，也稱「太太」、「夫人」。俗話說「妻賢夫禍少」，賢妻是家庭和諧的基石。');

// ═══════════════════════════════════════════════════════════════
// CHILDREN (Generation -1)
// ═══════════════════════════════════════════════════════════════
addPath(['兒子'], '兒子', '兒子，自己的男性後代。在傳統宗法制度中，兒子是延續香火、承繼宗祧的關鍵。');
addPath(['女兒'], '女兒', '女兒，自己的女性後代。俗話說「女兒是父母的貼心小棉襖」，體現了父母對女兒的疼愛。');

// ═══════════════════════════════════════════════════════════════
// PATERNAL UNCLES & AUNTS (Father's siblings)
// ═══════════════════════════════════════════════════════════════
addPath(['爸爸', '哥哥'], '伯父', '伯父，即父親的哥哥。俗稱「伯伯」。在傳統宗族中，伯父輩份僅次於祖父，有「伯父如父」之說。');
addPath(['爸爸', '弟弟'], '叔叔', '叔父，即父親的弟弟。俗稱「叔叔」。叔侄關係在宗族中非常親密，屬於「五服」之內的至親。');
addPath(['爸爸', '姊姊'], '姑姑', '姑母，即父親的姊姊。俗稱「姑姑」或「姑媽」。俗語「姑表親，輩輩親」，說明姑侄關係的親密。');
addPath(['爸爸', '妹妹'], '姑姑', '姑母，即父親的妹妹。俗稱「小姑」或「姑姑」。姑姑是父系家族中重要的女性長輩。');

// Paternal uncles/aunts' spouses
addPath(['爸爸', '哥哥', '妻子'], '伯母', '伯母，即伯父的妻子。俗稱「大媽」或「伯母」。在家族聚會中，伯母通常是最重要的女性主持者之一。');
addPath(['爸爸', '弟弟', '妻子'], '嬸嬸', '嬸母，即叔父的妻子。俗稱「嬸嬸」或「嬸母」。嬸嬸在大家庭中常扮演照顧侄子侄女的角色。');
addPath(['爸爸', '姊姊', '丈夫'], '姑丈', '姑丈，即姑母的丈夫。也稱「姑父」或「姑爹」。姑丈是父系的重要姻親，過年時常是座上賓。');
addPath(['爸爸', '妹妹', '丈夫'], '姑丈', '姑丈，即姑母的丈夫。也稱「姑父」。在傳統禮俗中，姑丈到女方家拜年是重要的社交活動。');

// ═══════════════════════════════════════════════════════════════
// MATERNAL UNCLES & AUNTS (Mother's siblings)
// ═══════════════════════════════════════════════════════════════
addPath(['媽媽', '哥哥'], '舅舅', '舅父，即母親的哥哥。俗稱「舅舅」。傳統有「天上雷公，地上舅公」的說法，舅舅在外甥的婚禮上有極重要的地位。');
addPath(['媽媽', '弟弟'], '舅舅', '舅父，即母親的弟弟。俗稱「舅舅」。俗語「娘親舅大」，舅舅是母系家族中地位最高的男性長輩。');
addPath(['媽媽', '姊姊'], '阿姨', '姨母，即母親的姊姊。俗稱「大姨」或「姨媽」。姨母與母親的感情往往最為親密，所以也格外疼愛外甥。');
addPath(['媽媽', '妹妹'], '阿姨', '姨母，即母親的妹妹。俗稱「小姨」。在許多家庭中，小姨與外甥的年齡差距較小，關係特別親近。');

// Maternal uncles/aunts' spouses
addPath(['媽媽', '哥哥', '妻子'], '舅媽', '舅母，即舅父的妻子。俗稱「舅媽」。在傳統禮俗中，舅媽在外甥家有著重要的地位。');
addPath(['媽媽', '弟弟', '妻子'], '舅媽', '舅母，即舅父的妻子。俗稱「舅媽」。舅媽是母系家族中重要的女性角色。');
addPath(['媽媽', '姊姊', '丈夫'], '姨丈', '姨丈，即姨母的丈夫。也稱「姨父」或「姨夫」。姨丈是母系的姻親，在家族聚會中同樣受到尊重。');
addPath(['媽媽', '妹妹', '丈夫'], '姨丈', '姨丈，即姨母的丈夫。也稱「姨父」。姨丈在現代家庭中通常與外甥關係親近。');

// ═══════════════════════════════════════════════════════════════
// COUSINS (Paternal side - 堂)
// ═══════════════════════════════════════════════════════════════
addPath(['爸爸', '哥哥', '兒子'], '堂哥', '堂兄，即伯父的兒子（年長）。「堂」字表示同祖父的親屬關係，堂兄弟在宗族中同屬一個「堂」，關係極為親密。');
addPath(['爸爸', '哥哥', '女兒'], '堂姊', '堂姊，即伯父的女兒（年長）。堂姊妹雖同姓同宗，但在傳統觀念中，女性出嫁後歸夫家。');
addPath(['爸爸', '弟弟', '兒子'], '堂弟', '堂弟，即叔父的兒子（年幼）。堂兄弟之間感情深厚，在宗族事務中互助合作。');
addPath(['爸爸', '弟弟', '女兒'], '堂妹', '堂妹，即叔父的女兒（年幼）。堂姊妹在傳統大家庭中一起長大，感情深厚。');

// ═══════════════════════════════════════════════════════════════
// COUSINS (Maternal side - 表)
// ═══════════════════════════════════════════════════════════════
addPath(['媽媽', '哥哥', '兒子'], '表哥', '表兄，即舅父的兒子（年長）。「表」字表示母系或姑系的親屬。俗語「姑表親，輩輩親；姨表親，當輩親」。');
addPath(['媽媽', '哥哥', '女兒'], '表姊', '表姊，即舅父的女兒（年長）。表姊妹之間的親情在傳統社會中受到重視。');
addPath(['媽媽', '弟弟', '兒子'], '表弟', '表弟，即舅父的兒子（年幼）。「外甥多似舅」，表兄弟之間常有相似的容貌或性格。');
addPath(['媽媽', '弟弟', '女兒'], '表妹', '表妹，即舅父的女兒（年幼）。在傳統文學中，表兄妹的故事經常出現。');

// 姑表 cousins
addPath(['爸爸', '姊姊', '兒子'], '表哥', '表兄，即姑母的兒子（年長）。屬於「姑表」親，俗語說「姑表親，輩輩親」，說明這層關係非常持久。');
addPath(['爸爸', '姊姊', '女兒'], '表姊', '表姊，即姑母的女兒（年長）。姑表姊妹在傳統社會中常有來往。');
addPath(['爸爸', '妹妹', '兒子'], '表弟', '表弟，即姑母的兒子（年幼）。姑表兄弟雖然不同姓，但在宗族中關係親密。');
addPath(['爸爸', '妹妹', '女兒'], '表妹', '表妹，即姑母的女兒（年幼）。姑表姊妹的感情在家族聚會中格外顯現。');

// 姨表 cousins
addPath(['媽媽', '姊姊', '兒子'], '表哥', '表兄，即姨母的兒子（年長）。屬於「姨表」親，雖然傳統上不如堂親和姑表親密，但在現代社會中同樣重要。');
addPath(['媽媽', '姊姊', '女兒'], '表姊', '表姊，即姨母的女兒（年長）。姨表姊妹常因母親的關係而親近。');
addPath(['媽媽', '妹妹', '兒子'], '表弟', '表弟，即姨母的兒子（年幼）。姨表兄弟是母系親屬中重要的同輩。');
addPath(['媽媽', '妹妹', '女兒'], '表妹', '表妹，即姨母的女兒（年幼）。姨表姊妹因母親的姊妹情誼而格外親近。');

// ═══════════════════════════════════════════════════════════════
// SPOUSE'S FAMILY (In-laws)
// ═══════════════════════════════════════════════════════════════
// Husband's family
addPath(['丈夫', '爸爸'], '公公', '公公，即丈夫的父親。也稱「家翁」。傳統禮俗中，媳婦對公公要畢恭畢敬，「翁媳」關係是家庭和諧的關鍵。');
addPath(['丈夫', '媽媽'], '婆婆', '婆婆，即丈夫的母親。也稱「家姑」。婆媳關係是中國家庭文化中最被關注的話題之一。');
addPath(['丈夫', '哥哥'], '大伯', '大伯子，即丈夫的哥哥。俗稱「大伯」。在傳統家庭中，大伯是夫家的重要長輩。');
addPath(['丈夫', '弟弟'], '小叔', '小叔子，即丈夫的弟弟。俗稱「小叔」。在傳統家庭中，嫂嫂對小叔有照顧的義務。');
addPath(['丈夫', '姊姊'], '大姑', '大姑子，即丈夫的姊姊。俗稱「大姑」或「大姑姐」。姑嫂關係在傳統家庭中需要巧妙維護。');
addPath(['丈夫', '妹妹'], '小姑', '小姑子，即丈夫的妹妹。俗稱「小姑」。在許多家庭故事中，小姑子的角色常受到關注。');

// Wife's family
addPath(['妻子', '爸爸'], '岳父', '岳父，即妻子的父親。也稱「丈人」、「泰山」。傳統上女婿見岳父需行大禮，「東床快婿」即是關於女婿的著名典故。');
addPath(['妻子', '媽媽'], '岳母', '岳母，即妻子的母親。也稱「丈母娘」。俗語說「丈母娘看女婿，越看越歡喜」，體現了岳母對女婿的期盼。');
addPath(['妻子', '哥哥'], '大舅子', '大舅子，即妻子的哥哥。也稱「內兄」。在傳統禮俗中，妻舅是男方重要的姻親。');
addPath(['妻子', '弟弟'], '小舅子', '小舅子，即妻子的弟弟。也稱「內弟」。在家族聚會中，小舅子常與姐夫關係親近。');
addPath(['妻子', '姊姊'], '大姨子', '大姨子，即妻子的姊姊。在家庭中，大姨子常是妻子的重要支持者。');
addPath(['妻子', '妹妹'], '小姨子', '小姨子，即妻子的妹妹。小姨子在許多傳統故事和民間笑話中常被提及。');

// ═══════════════════════════════════════════════════════════════
// SPOUSE'S FAMILY - Extended
// ═══════════════════════════════════════════════════════════════
addPath(['丈夫', '哥哥', '妻子'], '大嫂', '大嫂，即丈夫的哥哥的妻子。也就是「妯娌」關係中的姊妹。妯娌之間的和睦是家庭和諧的重要一環。');
addPath(['丈夫', '弟弟', '妻子'], '弟媳', '弟媳，即丈夫的弟弟的妻子。妯娌之間互稱「嫂嫂」或「弟妹」。');
addPath(['妻子', '姊姊', '丈夫'], '連襟', '連襟，即妻子的姊姊的丈夫。也稱「襟兄」。連襟關係是中國特有的姻親稱謂，也叫「擔挑」。');
addPath(['妻子', '妹妹', '丈夫'], '連襟', '連襟，即妻子的妹妹的丈夫。也稱「襟弟」。連襟之間在傳統社會中常互相幫助。');
addPath(['妻子', '哥哥', '妻子'], '舅嫂', '舅嫂，即妻子的哥哥的妻子。在家族聚會中是重要的姻親。');
addPath(['妻子', '弟弟', '妻子'], '舅嫂', '舅嫂，即妻子的弟弟的妻子。姻親之間禮尚往來是傳統社交的重要部分。');

// ═══════════════════════════════════════════════════════════════
// SIBLINGS' SPOUSES
// ═══════════════════════════════════════════════════════════════
addPath(['哥哥', '妻子'], '嫂嫂', '嫂子，即兄長的妻子。俗稱「嫂嫂」。「長嫂如母」，在傳統家庭中嫂嫂有著重要的地位。');
addPath(['弟弟', '妻子'], '弟媳', '弟媳婦，即弟弟的妻子。在家庭中，嫂嫂與弟媳的關係稱為「妯娌」。');
addPath(['姊姊', '丈夫'], '姊夫', '姊夫，即姊姊的丈夫。也稱「姐夫」。在家族中，姊夫是重要的姻親成員。');
addPath(['妹妹', '丈夫'], '妹夫', '妹夫，即妹妹的丈夫。在傳統禮俗中，兄弟對妹夫有考察和保護妹妹的責任。');

// ═══════════════════════════════════════════════════════════════
// NEPHEWS & NIECES
// ═══════════════════════════════════════════════════════════════
addPath(['哥哥', '兒子'], '姪子', '姪子，即兄長的兒子。「五服」之內的至親，在宗族傳承中與自己的兒子同輩。');
addPath(['哥哥', '女兒'], '姪女', '姪女，即兄長的女兒。在傳統家庭中，姪女出嫁時叔伯也要出席祝賀。');
addPath(['弟弟', '兒子'], '姪子', '姪子，即弟弟的兒子。叔姪關係親密，在宗族事務中互助互愛。');
addPath(['弟弟', '女兒'], '姪女', '姪女，即弟弟的女兒。叔叔對姪女的疼愛在傳統文化中常有體現。');
addPath(['姊姊', '兒子'], '外甥', '外甥，即姊姊的兒子。俗語「外甥多似舅」，指外甥的長相性格常像舅舅。');
addPath(['姊姊', '女兒'], '外甥女', '外甥女，即姊姊的女兒。舅舅與外甥女之間的親情在傳統家庭中非常珍貴。');
addPath(['妹妹', '兒子'], '外甥', '外甥，即妹妹的兒子。在傳統禮俗中，「舅甥」關係有著特殊的權力與義務。');
addPath(['妹妹', '女兒'], '外甥女', '外甥女，即妹妹的女兒。外甥女回娘家探望舅舅是傳統過年的重要活動。');

// ═══════════════════════════════════════════════════════════════
// GRANDCHILDREN (Generation -2)
// ═══════════════════════════════════════════════════════════════
addPath(['兒子', '兒子'], '孫子', '孫子，即兒子的兒子。俗語「含飴弄孫」，描繪祖孫之間的天倫之樂。');
addPath(['兒子', '女兒'], '孫女', '孫女，即兒子的女兒。在現代社會中，孫女同樣是傳遞家族情感的重要成員。');
addPath(['女兒', '兒子'], '外孫', '外孫，即女兒的兒子。外孫屬於外親，但「隔代親」的感情同樣深厚。');
addPath(['女兒', '女兒'], '外孫女', '外孫女，即女兒的女兒。外孫女是外祖父母的心頭肉。');

// ═══════════════════════════════════════════════════════════════
// CHILDREN'S SPOUSES
// ═══════════════════════════════════════════════════════════════
addPath(['兒子', '妻子'], '媳婦', '兒媳婦，即兒子的妻子。俗稱「媳婦」。婆媳關係是中國家庭文化中永恆的話題。');
addPath(['女兒', '丈夫'], '女婿', '女婿，即女兒的丈夫。俗稱「姑爺」。「東床快婿」的典故來自王羲之的故事。');

// ═══════════════════════════════════════════════════════════════
// DEEPER PATERNAL RELATIVES
// ═══════════════════════════════════════════════════════════════
// 伯父/叔父的兒女的配偶和子女
addPath(['爸爸', '哥哥', '兒子', '妻子'], '堂嫂', '堂嫂，即堂兄的妻子。在大家族中，堂嫂也是同輩中的重要成員。');
addPath(['爸爸', '弟弟', '兒子', '妻子'], '堂弟媳', '堂弟媳，即堂弟的妻子。在宗族聚會中同輩的媳婦們常一起操持家務。');
addPath(['爸爸', '哥哥', '女兒', '丈夫'], '堂姊夫', '堂姊夫，即堂姊的丈夫。堂親的姻親在傳統社會中也保持著禮節往來。');
addPath(['爸爸', '弟弟', '女兒', '丈夫'], '堂妹夫', '堂妹夫，即堂妹的丈夫。在大家族的婚禮上，堂親的配偶都會受邀出席。');

// ═══════════════════════════════════════════════════════════════
// PARENTS' PARENTS' SIBLINGS (Grand-uncles/aunts)
// ═══════════════════════════════════════════════════════════════
addPath(['爺爺', '哥哥'], '伯祖父', '伯祖父，即祖父的哥哥。俗稱「大爺爺」或「伯公」。在宗族中輩份極高，家族大事常需其主持。');
addPath(['爺爺', '弟弟'], '叔祖父', '叔祖父，即祖父的弟弟。俗稱「叔公」或「小爺爺」。在傳統五服制度中屬於「大功」服。');
addPath(['爺爺', '姊姊'], '姑祖母', '姑祖母，即祖父的姊姊。俗稱「姑婆」。在大家族中是受尊敬的長輩。');
addPath(['爺爺', '妹妹'], '姑祖母', '姑祖母，即祖父的妹妹。俗稱「姑婆」。家族聚會時，姑婆的到來總是備受歡迎。');
addPath(['奶奶', '哥哥'], '舅祖父', '舅祖父，即祖母的兄長。俗稱「舅公」。在傳統禮俗中，舅公是父系家族的重要外親。');
addPath(['奶奶', '弟弟'], '舅祖父', '舅祖父，即祖母的弟弟。俗稱「舅公」。');
addPath(['奶奶', '姊姊'], '姨祖母', '姨祖母，即祖母的姊姊。俗稱「姨婆」。');
addPath(['奶奶', '妹妹'], '姨祖母', '姨祖母，即祖母的妹妹。俗稱「姨婆」。');

addPath(['外公', '哥哥'], '伯外祖父', '伯外祖父，即外祖父的哥哥。俗稱「大外公」。屬於母系長輩中輩份最高的一群。');
addPath(['外公', '弟弟'], '叔外祖父', '叔外祖父，即外祖父的弟弟。俗稱「小外公」。');
addPath(['外公', '姊姊'], '姑外祖母', '姑外祖母，即外祖父的姊姊。俗稱「姑外婆」。');
addPath(['外公', '妹妹'], '姑外祖母', '姑外祖母，即外祖父的妹妹。俗稱「姑外婆」。');
addPath(['外婆', '哥哥'], '舅外祖父', '舅外祖父，即外祖母的兄長。俗稱「舅外公」。');
addPath(['外婆', '弟弟'], '舅外祖父', '舅外祖父，即外祖母的弟弟。俗稱「舅外公」。');
addPath(['外婆', '姊姊'], '姨外祖母', '姨外祖母，即外祖母的姊姊。俗稱「姨外婆」。');
addPath(['外婆', '妹妹'], '姨外祖母', '姨外祖母，即外祖母的妹妹。俗稱「姨外婆」。');

// ═══════════════════════════════════════════════════════════════
// SPECIAL COMBINATIONS
// ═══════════════════════════════════════════════════════════════

// 妯娌 (wives of brothers)
addPath(['哥哥', '妻子'], '嫂嫂', '嫂子，即兄長的妻子。「長嫂如母」，在傳統家庭中嫂嫂有著重要的地位。');

// 連襟/襟兄弟 (husbands of sisters) - already covered above

// Children's children's spouses
addPath(['兒子', '兒子', '妻子'], '孫媳婦', '孫媳婦，即孫子的妻子。在三代同堂的傳統家庭中，孫媳婦的到來象徵著家族的興旺。');
addPath(['兒子', '女兒', '丈夫'], '孫女婿', '孫女婿，即孫女的丈夫。在大家庭中，孫女婿也是受歡迎的晚輩。');
addPath(['女兒', '兒子', '妻子'], '外孫媳婦', '外孫媳婦，即外孫的妻子。體現了家族的延續與發展。');
addPath(['女兒', '女兒', '丈夫'], '外孫女婿', '外孫女婿，即外孫女的丈夫。雖屬外親的外親，但在現代家庭中同樣受到關愛。');

// Great-grandchildren
addPath(['兒子', '兒子', '兒子'], '曾孫', '曾孫，即孫子的兒子。四代同堂是中國家庭的美好願景，曾孫的出生象徵著家族的繁榮。');
addPath(['兒子', '兒子', '女兒'], '曾孫女', '曾孫女，即孫子的女兒。在傳統觀念中，四代同堂是最大的福氣。');
addPath(['兒子', '女兒', '兒子'], '曾外孫', '曾外孫，即孫女的兒子。體現了家族血脈的延續。');
addPath(['兒子', '女兒', '女兒'], '曾外孫女', '曾外孫女，即孫女的女兒。');
addPath(['女兒', '兒子', '兒子'], '外曾孫', '外曾孫，即外孫的兒子。外曾孫是外祖家族的延伸。');
addPath(['女兒', '兒子', '女兒'], '外曾孫女', '外曾孫女，即外孫的女兒。');
addPath(['女兒', '女兒', '兒子'], '外曾外孫', '外曾外孫，即外孫女的兒子。');
addPath(['女兒', '女兒', '女兒'], '外曾外孫女', '外曾外孫女，即外孫女的女兒。');

// ═══════════════════════════════════════════════════════════════
// SPOUSE'S SIBLINGS' CHILDREN (丈夫/妻子的兄弟姊妹的孩子)
// ═══════════════════════════════════════════════════════════════
addPath(['丈夫', '哥哥', '兒子'], '姪子', '姪子，即丈夫的哥哥的兒子。在夫家中同輩的孩子們互稱兄弟。');
addPath(['丈夫', '哥哥', '女兒'], '姪女', '姪女，即丈夫的哥哥的女兒。在家族聚會中是同輩的晚輩。');
addPath(['丈夫', '弟弟', '兒子'], '姪子', '姪子，即丈夫的弟弟的兒子。在夫家中，嬸嬸對姪子有照顧的責任。');
addPath(['丈夫', '弟弟', '女兒'], '姪女', '姪女，即丈夫的弟弟的女兒。');
addPath(['丈夫', '姊姊', '兒子'], '外甥', '外甥，即丈夫的姊姊的兒子。');
addPath(['丈夫', '姊姊', '女兒'], '外甥女', '外甥女，即丈夫的姊姊的女兒。');
addPath(['丈夫', '妹妹', '兒子'], '外甥', '外甥，即丈夫的妹妹的兒子。');
addPath(['丈夫', '妹妹', '女兒'], '外甥女', '外甥女，即丈夫的妹妹的女兒。');

addPath(['妻子', '哥哥', '兒子'], '舅甥', '舅甥，即妻子的哥哥的兒子。在姻親關係中屬於妻系的晚輩。');
addPath(['妻子', '哥哥', '女兒'], '舅甥女', '舅甥女，即妻子的哥哥的女兒。');
addPath(['妻子', '弟弟', '兒子'], '舅甥', '舅甥，即妻子的弟弟的兒子。');
addPath(['妻子', '弟弟', '女兒'], '舅甥女', '舅甥女，即妻子的弟弟的女兒。');
addPath(['妻子', '姊姊', '兒子'], '姨甥', '姨甥，即妻子的姊姊的兒子。在傳統姻親關係中屬於「姨」系的晚輩。');
addPath(['妻子', '姊姊', '女兒'], '姨甥女', '姨甥女，即妻子的姊姊的女兒。');
addPath(['妻子', '妹妹', '兒子'], '姨甥', '姨甥，即妻子的妹妹的兒子。');
addPath(['妻子', '妹妹', '女兒'], '姨甥女', '姨甥女，即妻子的妹妹的女兒。');

// ═══════════════════════════════════════════════════════════════
// SPOUSE'S PARENTS' SIBLINGS
// ═══════════════════════════════════════════════════════════════
addPath(['丈夫', '爸爸', '哥哥'], '伯公', '伯公，即公公的哥哥。在夫家中輩份極高的長輩。');
addPath(['丈夫', '爸爸', '弟弟'], '叔公', '叔公，即公公的弟弟。在夫家的宗族中是重要的長輩。');
addPath(['丈夫', '爸爸', '姊姊'], '姑婆', '姑婆，即公公的姊姊。在夫家中是受尊敬的女性長輩。');
addPath(['丈夫', '爸爸', '妹妹'], '姑婆', '姑婆，即公公的妹妹。在家族聚會中，姑婆的意見常被重視。');
addPath(['丈夫', '媽媽', '哥哥'], '舅公', '舅公，即婆婆的兄長。在夫家的外親中輩份最高。');
addPath(['丈夫', '媽媽', '弟弟'], '舅公', '舅公，即婆婆的弟弟。');
addPath(['丈夫', '媽媽', '姊姊'], '姨婆', '姨婆，即婆婆的姊姊。');
addPath(['丈夫', '媽媽', '妹妹'], '姨婆', '姨婆，即婆婆的妹妹。');

addPath(['妻子', '爸爸', '哥哥'], '伯岳父', '伯岳父，即岳父的哥哥。在妻家中是輩份很高的長輩。');
addPath(['妻子', '爸爸', '弟弟'], '叔岳父', '叔岳父，即岳父的弟弟。女婿在妻家需對長輩恭敬有加。');
addPath(['妻子', '爸爸', '姊姊'], '姑岳母', '姑岳母，即岳父的姊姊。');
addPath(['妻子', '爸爸', '妹妹'], '姑岳母', '姑岳母，即岳父的妹妹。');
addPath(['妻子', '媽媽', '哥哥'], '舅岳父', '舅岳父，即岳母的兄長。');
addPath(['妻子', '媽媽', '弟弟'], '舅岳父', '舅岳父，即岳母的弟弟。');
addPath(['妻子', '媽媽', '姊姊'], '姨岳母', '姨岳母，即岳母的姊姊。');
addPath(['妻子', '媽媽', '妹妹'], '姨岳母', '姨岳母，即岳母的妹妹。');

// ═══════════════════════════════════════════════════════════════
// PARENT → PARENT → SIBLING → CHILD (二代堂/表)
// ═══════════════════════════════════════════════════════════════
addPath(['爸爸', '爸爸', '哥哥', '兒子'], '伯叔', '伯父或叔父，即祖父的兄長的兒子。在宗族中與自己的父親同輩，根據年齡大小稱「伯」或「叔」。');
addPath(['爸爸', '爸爸', '弟弟', '兒子'], '堂叔', '堂叔，即祖父的弟弟的兒子。在宗族中與父親同輩，屬於堂親。');
addPath(['爸爸', '爸爸', '哥哥', '女兒'], '堂姑', '堂姑，即祖父的兄長的女兒。在宗族中與父親同輩的女性親屬。');
addPath(['爸爸', '爸爸', '弟弟', '女兒'], '堂姑', '堂姑，即祖父的弟弟的女兒。與父親同輩的堂親。');

// ═══════════════════════════════════════════════════════════════
// SIBLINGS' CHILDREN'S SPOUSES & CHILDREN
// ═══════════════════════════════════════════════════════════════
addPath(['哥哥', '兒子', '妻子'], '姪媳', '姪媳，即姪子的妻子。在大家庭中，姪媳的到來代表著家族的成長。');
addPath(['哥哥', '女兒', '丈夫'], '姪女婿', '姪女婿，即姪女的丈夫。在家族婚禮中，叔伯通常扮演重要角色。');
addPath(['弟弟', '兒子', '妻子'], '姪媳', '姪媳，即姪子的妻子。在家族中代表著新一代的加入。');
addPath(['弟弟', '女兒', '丈夫'], '姪女婿', '姪女婿，即姪女的丈夫。');

addPath(['哥哥', '兒子', '兒子'], '姪孫', '姪孫，即姪子的兒子。在宗族中比自己低兩輩。');
addPath(['哥哥', '兒子', '女兒'], '姪孫女', '姪孫女，即姪子的女兒。');
addPath(['哥哥', '女兒', '兒子'], '姪外孫', '姪外孫，即姪女的兒子。');
addPath(['哥哥', '女兒', '女兒'], '姪外孫女', '姪外孫女，即姪女的女兒。');
addPath(['弟弟', '兒子', '兒子'], '姪孫', '姪孫，即姪子的兒子。');
addPath(['弟弟', '兒子', '女兒'], '姪孫女', '姪孫女，即姪子的女兒。');
addPath(['弟弟', '女兒', '兒子'], '姪外孫', '姪外孫，即姪女的兒子。');
addPath(['弟弟', '女兒', '女兒'], '姪外孫女', '姪外孫女，即姪女的女兒。');

addPath(['姊姊', '兒子', '兒子'], '甥孫', '甥孫，即外甥的兒子。在母系親屬中比自己低兩輩。');
addPath(['姊姊', '兒子', '女兒'], '甥孫女', '甥孫女，即外甥的女兒。');
addPath(['姊姊', '女兒', '兒子'], '甥外孫', '甥外孫，即外甥女的兒子。');
addPath(['姊姊', '女兒', '女兒'], '甥外孫女', '甥外孫女，即外甥女的女兒。');
addPath(['妹妹', '兒子', '兒子'], '甥孫', '甥孫，即外甥的兒子。');
addPath(['妹妹', '兒子', '女兒'], '甥孫女', '甥孫女，即外甥的女兒。');
addPath(['妹妹', '女兒', '兒子'], '甥外孫', '甥外孫，即外甥女的兒子。');
addPath(['妹妹', '女兒', '女兒'], '甥外孫女', '甥外孫女，即外甥女的女兒。');

// ═══════════════════════════════════════════════════════════════
// GRANDPARENT LEVEL SPOUSE COMBINATIONS
// ═══════════════════════════════════════════════════════════════
addPath(['爺爺', '哥哥', '妻子'], '伯祖母', '伯祖母，即伯祖父的妻子。俗稱「大奶奶」。在宗族中是輩份極高的女性長輩。');
addPath(['爺爺', '弟弟', '妻子'], '叔祖母', '叔祖母，即叔祖父的妻子。俗稱「小奶奶」或「叔婆」。');
addPath(['爺爺', '姊姊', '丈夫'], '姑祖父', '姑祖父，即姑祖母的丈夫。俗稱「姑公」。');
addPath(['爺爺', '妹妹', '丈夫'], '姑祖父', '姑祖父，即姑祖母的丈夫。俗稱「姑公」。');

// ═══════════════════════════════════════════════════════════════
// PARENT-LEVEL: Father's/Mother's siblings via grandparents
// ═══════════════════════════════════════════════════════════════
addPath(['爸爸', '爸爸', '哥哥'], '伯祖父', '伯祖父，即父親的伯父（祖父的兄長）。在宗族中輩份極高。');
addPath(['爸爸', '爸爸', '弟弟'], '叔祖父', '叔祖父，即父親的叔父（祖父的弟弟）。在宗族中是重要的長輩。');
addPath(['爸爸', '媽媽', '哥哥'], '舅公', '舅公，即奶奶的兄長。在父系家族的外親中地位崇高。');
addPath(['爸爸', '媽媽', '弟弟'], '舅公', '舅公，即奶奶的弟弟。');
addPath(['爸爸', '媽媽', '姊姊'], '姨婆', '姨婆，即奶奶的姊姊。');
addPath(['爸爸', '媽媽', '妹妹'], '姨婆', '姨婆，即奶奶的妹妹。');

addPath(['媽媽', '爸爸', '哥哥'], '伯外祖父', '伯外祖父，即外祖父的兄長。俗稱「大外公」。');
addPath(['媽媽', '爸爸', '弟弟'], '叔外祖父', '叔外祖父，即外祖父的弟弟。俗稱「小外公」。');
addPath(['媽媽', '媽媽', '哥哥'], '舅外祖父', '舅外祖父，即外祖母的兄長。俗稱「舅外公」。');
addPath(['媽媽', '媽媽', '弟弟'], '舅外祖父', '舅外祖父，即外祖母的弟弟。俗稱「舅外公」。');
addPath(['媽媽', '媽媽', '姊姊'], '姨外祖母', '姨外祖母，即外祖母的姊姊。俗稱「姨外婆」。');
addPath(['媽媽', '媽媽', '妹妹'], '姨外祖母', '姨外祖母，即外祖母的妹妹。俗稱「姨外婆」。');

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT: Calculate kinship from path
// ═══════════════════════════════════════════════════════════════

export function calculateKinship(path: string[]): KinshipResult {
  if (path.length === 0) {
    return { title: '我', explanation: '請點擊按鈕組合親戚關係後，點擊「開始計算」' };
  }

  // 1. Direct lookup
  const key = path.join('→');
  if (PATH_LOOKUP[key]) {
    return PATH_LOOKUP[key];
  }

  // 2. Algorithmic fallback using position tracking
  return algorithmicResolve(path);
}

// ─── Algorithmic Fallback ─────────────────────────────────────────────────
// For paths not in the lookup table, we use generation/gender/lineage tracking

function algorithmicResolve(path: string[]): KinshipResult {
  let pos: PersonPosition = {
    generation: 0,
    gender: 'M', // Assume self is male by default; we can't know
    lineage: 'self',
    seniority: 'unknown',
    pathDescription: [],
  };

  for (const step of path) {
    pos = resolveStep(pos, step);
  }

  const gen = pos.generation;
  const gender = pos.gender;
  const lineage = pos.lineage;
  const seniority = pos.seniority;
  const pathStr = path.join(' 的 ');

  // Try to generate a reasonable title
  let title = '';
  let explanation = `「${pathStr}」`;

  // Generation +3 and above
  if (gen >= 3) {
    const prefix = gen === 3 ? '曾' : gen === 4 ? '高' : '遠';
    const linPrefix = lineage === 'maternal' ? '外' : '';
    title = gender === 'M' ? `${linPrefix}${prefix}祖父` : `${linPrefix}${prefix}祖母`;
    explanation += `，屬於第${gen}代長輩，是家族中極為尊崇的先祖。`;
  }
  // Generation +2
  else if (gen === 2) {
    if (lineage === 'paternal' || lineage === 'self') {
      title = gender === 'M' ? '祖父輩男性親屬' : '祖父輩女性親屬';
    } else {
      title = gender === 'M' ? '外祖父輩男性親屬' : '外祖父輩女性親屬';
    }
    explanation += `，屬於祖父母輩的親屬。`;
  }
  // Generation +1
  else if (gen === 1) {
    if (lineage === 'paternal') {
      if (gender === 'M') {
        title = seniority === 'elder' ? '伯父輩' : seniority === 'younger' ? '叔父輩' : '父輩男性親屬';
      } else {
        title = '姑母輩';
      }
    } else if (lineage === 'maternal') {
      if (gender === 'M') {
        title = '舅父輩';
      } else {
        title = '姨母輩';
      }
    } else {
      title = gender === 'M' ? '父輩男性親屬' : '父輩女性親屬';
    }
    explanation += `，屬於父母輩的長輩。在傳統禮俗中，對長輩應畢恭畢敬。`;
  }
  // Generation 0
  else if (gen === 0) {
    if (pos.isSpouseOf) {
      title = gender === 'M' ? '同輩男性姻親' : '同輩女性姻親';
      explanation += `，是同輩中的姻親關係。`;
    } else {
      if (lineage === 'paternal') {
        title = gender === 'M'
          ? (seniority === 'elder' ? '堂兄' : seniority === 'younger' ? '堂弟' : '堂兄弟')
          : (seniority === 'elder' ? '堂姊' : seniority === 'younger' ? '堂妹' : '堂姊妹');
      } else if (lineage === 'maternal') {
        title = gender === 'M'
          ? (seniority === 'elder' ? '表兄' : seniority === 'younger' ? '表弟' : '表兄弟')
          : (seniority === 'elder' ? '表姊' : seniority === 'younger' ? '表妹' : '表姊妹');
      } else {
        title = gender === 'M'
          ? (seniority === 'elder' ? '兄' : seniority === 'younger' ? '弟' : '同輩男性')
          : (seniority === 'elder' ? '姊' : seniority === 'younger' ? '妹' : '同輩女性');
      }
      explanation += `，是同輩的親屬。`;
    }
  }
  // Generation -1
  else if (gen === -1) {
    if (lineage === 'paternal' || lineage === 'self') {
      title = gender === 'M' ? '姪子輩' : '姪女輩';
    } else {
      title = gender === 'M' ? '外甥輩' : '外甥女輩';
    }
    explanation += `，屬於晚一輩的親屬。`;
  }
  // Generation -2
  else if (gen === -2) {
    if (lineage === 'paternal' || lineage === 'self') {
      title = gender === 'M' ? '孫子輩' : '孫女輩';
    } else {
      title = gender === 'M' ? '外孫輩' : '外孫女輩';
    }
    explanation += `，屬於晚兩輩的親屬，體現了家族的延續。`;
  }
  // Generation -3 and below
  else if (gen <= -3) {
    const prefix = gen === -3 ? '曾' : gen === -4 ? '玄' : '遠';
    const linPrefix = lineage === 'maternal' ? '外' : '';
    title = gender === 'M' ? `${linPrefix}${prefix}孫` : `${linPrefix}${prefix}孫女`;
    explanation += `，屬於第${Math.abs(gen)}代晚輩。`;
  }

  if (!title) {
    title = '親屬';
    explanation = `「${pathStr}」的關係較為複雜，建議詢問家中長輩確認正確稱謂。`;
  }

  return { title, explanation };
}

// ═══════════════════════════════════════════════════════════════
// Browser TTS (using Web Speech API as fallback)
// ═══════════════════════════════════════════════════════════════

export function speakTextOffline(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v =>
      v.lang.startsWith('zh') && (v.lang.includes('TW') || v.lang.includes('Hant'))
    ) || voices.find(v => v.lang.startsWith('zh'));

    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}
