import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";

// 脚本运行时 cwd 应为项目根目录（通过 pnpm create-company 运行）
const PROJECT_ROOT = process.cwd();
const INDUSTRY_DIR = path.join(PROJECT_ROOT, "industry");
const TEMPLATE_DIR = path.join(INDUSTRY_DIR, "新建公司模板", "新公司");

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
 * 行业级 index.md 模板
 */
function generateIndustryIndex(industryName: string): string {
  return `# ${industryName}`;
}

async function main() {
  const rl = createPrompt();

  console.log("=== 新建公司向导 ===\n");

  // 1. 输入行业名称
  const industryName = (
    await rl.question('请输入行业名称（如"中药"）：')
  ).trim();
  if (!industryName) {
    console.error("错误：行业名称不能为空");
    rl.close();
    process.exit(1);
  }

  // 2. 检查行业目录是否存在，不存在则创建
  const industryPath = path.join(INDUSTRY_DIR, industryName);
  const industrySubPath = path.join(industryPath, industryName);

  if (!fs.existsSync(industryPath)) {
    console.log(`\n行业目录 "${industryName}" 不存在，正在创建...`);
    fs.mkdirSync(industrySubPath, { recursive: true });

    // 创建行业级 index.md
    const industryIndexPath = path.join(industrySubPath, "index.md");
    fs.writeFileSync(
      industryIndexPath,
      generateIndustryIndex(industryName),
      "utf-8",
    );
    console.log(`✅ 已创建行业目录: industry/${industryName}/`);
    console.log(
      `✅ 已创建行业主页: industry/${industryName}/${industryName}/index.md`,
    );
  } else {
    console.log(`✅ 行业目录已存在: industry/${industryName}/`);

    // 确保行业子目录也存在
    if (!fs.existsSync(industrySubPath)) {
      fs.mkdirSync(industrySubPath, { recursive: true });
      const industryIndexPath = path.join(industrySubPath, "index.md");
      fs.writeFileSync(
        industryIndexPath,
        generateIndustryIndex(industryName),
        "utf-8",
      );
      console.log(
        `✅ 已补充创建行业主页: industry/${industryName}/${industryName}/index.md`,
      );
    }
  }

  // 3. 输入公司名称和股票代码
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

  // 4. 检查公司目录是否已存在
  const companyPath = path.join(industryPath, companyName);
  if (fs.existsSync(companyPath)) {
    console.error(
      `\n错误：公司目录已存在: industry/${industryName}/${companyName}/`,
    );
    process.exit(1);
  }

  // 5. 拷贝模板并替换占位符
  console.log(`\n正在创建公司 "${companyName}"（${stockCode}）...`);

  const replacements: Record<string, string> = {
    "600436": stockCode,
    片仔癀: companyName, // 只替换 index.md 中的标题占位符
  };

  copyDirWithReplace(TEMPLATE_DIR, companyPath, replacements);

  // 6. 汇总输出
  console.log("");
  console.log("✅ 公司创建成功！");
  console.log("");
  console.log("📁 已创建的文件：");
  const createdFiles = listFilesRecursive(companyPath, companyPath);
  for (const f of createdFiles) {
    console.log(`   industry/${industryName}/${companyName}/${f}`);
  }
  console.log("");
  console.log("📋 后续步骤：");
  console.log(
    `   1. 在 types/stocks/ 下找到或新建对应行业的配置文件，添加 ${companyName} 的 StockItem`,
  );
  console.log(
    `   2. 修改 industry/${industryName}/${companyName}/index.md 添加研究笔记`,
  );
  console.log(
    `   3. 修改 industry/${industryName}/${companyName}/financials.md 补充财务分析`,
  );
  console.log(
    `   4. 修改 industry/${industryName}/${companyName}/valuation.md 设置估值参数`,
  );
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
