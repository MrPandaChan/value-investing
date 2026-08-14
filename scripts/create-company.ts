import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";

// 脚本运行时 cwd 应为项目根目录（通过 pnpm create-company 运行）
const PROJECT_ROOT = process.cwd();
const INDUSTRY_DIR = path.join(PROJECT_ROOT, "industry");
const TEMPLATE_DIR = path.join(PROJECT_ROOT, "templates", "新建公司模板", "新公司");
const OVERVIEW_FILE = "行业总览.md";
const TOUYAN_DIR = "投研资料";

/**
 * 创建交互式命令行接口
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * 拷贝目录（递归），在拷贝过程中替换模板占位符
 */
function copyDirWithReplace(
  src: string,
  dest: string,
  replacements: Record<string, string>,
): void {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirWithReplace(srcPath, destPath, replacements);
    } else {
      let content = fs.readFileSync(srcPath, "utf-8");
      // 应用所有替换
      for (const [from, to] of Object.entries(replacements)) {
        content = content.replaceAll(from, to);
      }
      fs.writeFileSync(destPath, content, "utf-8");
    }
  }
}

/**
 * 生成「投研资料/行业总览.md」占位内容
 */
function generateOverview(name: string): string {
  return `# ${name}\n`;
}

/**
 * 确保某目录下存在「投研资料/行业总览.md」占位
 */
function ensureOverview(parentDir: string, name: string): void {
  const touyan = path.join(parentDir, TOUYAN_DIR);
  fs.mkdirSync(touyan, { recursive: true });
  const overviewPath = path.join(touyan, OVERVIEW_FILE);
  if (!fs.existsSync(overviewPath)) {
    fs.writeFileSync(overviewPath, generateOverview(name), "utf-8");
  }
}

/**
 * 判断目录是否为「赛道」：目录下含投研资料子目录
 */
function isSegment(dir: string): boolean {
  return fs.existsSync(path.join(dir, TOUYAN_DIR));
}

/**
 * 列出行业下的已有赛道（含投研资料子目录的目录）
 */
function listSegments(industryPath: string): string[] {
  if (!fs.existsSync(industryPath)) return [];
  return fs
    .readdirSync(industryPath, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith(".") &&
        d.name !== TOUYAN_DIR &&
        isSegment(path.join(industryPath, d.name)),
    )
    .map((d) => d.name)
    .sort();
}

async function main() {
  const rl = createPrompt();

  console.log("=== 新建公司向导 ===\n");

  // 1. 输入一级行业名称
  const industryName = (
    await rl.question('请输入一级行业名称（如"汽车"）：')
  ).trim();
  if (!industryName) {
    console.error("错误：行业名称不能为空");
    rl.close();
    process.exit(1);
  }

  // 2. 检查一级行业目录，不存在则创建
  const industryPath = path.join(INDUSTRY_DIR, industryName);
  if (!fs.existsSync(industryPath)) {
    console.log(`\n一级行业目录 "${industryName}" 不存在，正在创建...`);
    fs.mkdirSync(industryPath, { recursive: true });
    ensureOverview(industryPath, industryName);
    console.log(`✅ 已创建行业目录: industry/${industryName}/`);
    console.log(
      `✅ 已创建行业总览: industry/${industryName}/${TOUYAN_DIR}/${OVERVIEW_FILE}`,
    );
  } else {
    console.log(`✅ 一级行业目录已存在: industry/${industryName}/`);
  }

  // 3. 选择 / 创建赛道
  const existingSegments = listSegments(industryPath);
  let segmentName: string | null = null;

  if (existingSegments.length > 0) {
    console.log(`\n该行业已有以下赛道：`);
    existingSegments.forEach((s, i) => console.log(`   [${i + 1}] ${s}`));
    const choice = (
      await rl.question(
        '\n请选择赛道：输入编号选择已有赛道、输入新赛道名创建、或输入"无"表示不拆赛道（公司直接挂一级行业下）：',
      )
    ).trim();

    if (choice && choice !== "无") {
      const num = parseInt(choice, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= existingSegments.length) {
        segmentName = existingSegments[num - 1];
      } else {
        segmentName = choice;
      }
    }
  } else {
    const choice = (
      await rl.question(
        '\n该行业暂无赛道。请输入赛道名称（如"乘用车"），或输入"无"表示不拆赛道、公司直接挂一级行业下：',
      )
    ).trim();
    if (choice && choice !== "无") segmentName = choice;
  }

  if (segmentName) {
    const segPath = path.join(industryPath, segmentName);
    if (!fs.existsSync(segPath)) {
      fs.mkdirSync(segPath, { recursive: true });
      ensureOverview(segPath, segmentName);
      console.log(`✅ 已创建赛道: industry/${industryName}/${segmentName}/`);
      console.log(
        `✅ 已创建赛道总览: industry/${industryName}/${segmentName}/${TOUYAN_DIR}/${OVERVIEW_FILE}`,
      );
    } else {
      console.log(`✅ 赛道已存在: industry/${industryName}/${segmentName}/`);
    }
  }

  // 4. 输入公司名称和股票代码
  console.log("");
  const companyName = (
    await rl.question('请输入公司名称（如"片仔癀"）：')
  ).trim();
  if (!companyName) {
    console.error("错误：公司名称不能为空");
    rl.close();
    process.exit(1);
  }

  const stockCode = (
    await rl.question('请输入股票代码（如"600436"）：')
  ).trim();
  if (!stockCode) {
    console.error("错误：股票代码不能为空");
    rl.close();
    process.exit(1);
  }

  rl.close();

  // 5. 公司目录：拆赛道则放入赛道下，不拆则直接挂一级行业下
  const companyPath = segmentName
    ? path.join(industryPath, segmentName, companyName)
    : path.join(industryPath, companyName);

  if (fs.existsSync(companyPath)) {
    console.error(`\n错误：公司目录已存在: ${path.relative(PROJECT_ROOT, companyPath)}/`);
    process.exit(1);
  }

  // 6. 拷贝模板并替换占位符
  console.log(`\n正在创建公司 "${companyName}"（${stockCode}）...`);

  const replacements: Record<string, string> = {
    "600436": stockCode,
    片仔癀: companyName, // 只替换 index.md 中的标题占位符
  };

  copyDirWithReplace(TEMPLATE_DIR, companyPath, replacements);

  // 7. 汇总输出
  const relBase = segmentName
    ? `industry/${industryName}/${segmentName}/${companyName}`
    : `industry/${industryName}/${companyName}`;

  console.log("");
  console.log("✅ 公司创建成功！");
  console.log("");
  console.log("📁 已创建的文件：");
  const createdFiles = listFilesRecursive(companyPath, companyPath);
  for (const f of createdFiles) {
    console.log(`   ${relBase}/${f}`);
  }
  console.log("");
  console.log("📋 后续步骤：");
  console.log(
    `   1. 在 types/stocks/ 下找到或新建对应行业的配置文件，添加 ${companyName} 的 StockItem`,
  );
  console.log(`   2. 修改 ${relBase}/index.md 添加研究笔记`);
  console.log(`   3. 修改 ${relBase}/financials.md 补充财务分析`);
  console.log(`   4. 修改 ${relBase}/valuation.md 设置估值参数`);
  console.log(`   5. 运行 pnpm update-data 拉取财务数据`);
}

/**
 * 递归列出目录中的文件（相对路径）
 */
function listFilesRecursive(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath, baseDir));
    } else {
      results.push(relativePath.replaceAll("\\", "/"));
    }
  }
  return results;
}

main().catch((err) => {
  console.error("发生错误：", err);
  process.exit(1);
});
