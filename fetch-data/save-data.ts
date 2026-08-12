import fs from "fs";
import path from "path";

/**
 * 将JSON数据保存到文件
 * @param data 要保存的JSON数据
 * @param filePath 文件保存路径
 * @param options 可选配置项
 * @returns 保存是否成功
 */
export function saveJsonToFile(
  data: any,
  filePath: string,
  options?: {
    pretty?: boolean; // 是否美化JSON格式
    encoding?: BufferEncoding; // 文件编码
    createDir?: boolean; // 如果目录不存在是否创建
  },
): boolean {
  try {
    const opts = {
      pretty: true,
      encoding: "utf8" as BufferEncoding,
      createDir: true,
      ...options,
    };

    // 确保目录存在
    if (opts.createDir) {
      const dirname = path.dirname(filePath);
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }
    }

    // 将数据转换为JSON字符串
    const jsonString = opts.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // 写入文件
    fs.writeFileSync(filePath, jsonString, { encoding: opts.encoding });

    return true;
  } catch (error) {
    console.error(
      `保存JSON数据到文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * 异步将JSON数据保存到文件
 * @param data 要保存的JSON数据
 * @param filePath 文件保存路径
 * @param options 可选配置项
 * @returns Promise<boolean> 保存是否成功的Promise
 */
export async function saveJsonToFileAsync(
  data: any,
  filePath: string,
  options?: {
    pretty?: boolean; // 是否美化JSON格式
    encoding?: BufferEncoding; // 文件编码
    createDir?: boolean; // 如果目录不存在是否创建
  },
): Promise<boolean> {
  try {
    const opts = {
      pretty: true,
      encoding: "utf8" as BufferEncoding,
      createDir: true,
      ...options,
    };

    // 确保目录存在
    if (opts.createDir) {
      const dirname = path.dirname(filePath);
      if (!fs.existsSync(dirname)) {
        await fs.promises.mkdir(dirname, { recursive: true });
      }
    }

    // 将数据转换为JSON字符串
    const jsonString = opts.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // 异步写入文件
    await fs.promises.writeFile(filePath, jsonString, {
      encoding: opts.encoding,
    });

    return true;
  } catch (error) {
    console.error(
      `异步保存JSON数据到文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * 将数据保存为TypeScript文件
 * @param data 要保存的数据
 * @param filePath 文件保存路径
 * @param options 可选配置项
 * @returns 保存是否成功
 */
export function saveDataToTsFile(
  data: any,
  filePath: string,
  options?: {
    exportName?: string; // 导出变量名
    exportType?: "const" | "let" | "var"; // 导出类型
    exportDefault?: boolean; // 是否默认导出
    typeAnnotation?: string; // 类型注解
    encoding?: BufferEncoding; // 文件编码
    createDir?: boolean; // 如果目录不存在是否创建
    pretty?: boolean; // 是否美化JSON格式
  },
): boolean {
  try {
    const opts = {
      exportName: "data",
      exportType: "const" as const,
      exportDefault: false,
      typeAnnotation: "",
      encoding: "utf8" as BufferEncoding,
      createDir: true,
      pretty: true,
      ...options,
    };

    // 确保目录存在
    if (opts.createDir) {
      const dirname = path.dirname(filePath);
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }
    }

    // 将数据转换为JSON字符串
    const jsonString = opts.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // 构建TypeScript内容
    let tsContent = "";

    // 添加类型注解
    if (opts.typeAnnotation) {
      tsContent += `${opts.exportType} ${opts.exportName}${opts.typeAnnotation} = ${jsonString};
`;
    } else {
      tsContent += `${opts.exportType} ${opts.exportName} = ${jsonString};
`;
    }

    // 添加默认导出
    if (opts.exportDefault && !opts.exportName.includes("default")) {
      tsContent += `
export default ${opts.exportName};
`;
    } else if (opts.exportDefault) {
      // 如果exportName已经包含default，则不添加额外的默认导出
    } else {
      tsContent += `
export { ${opts.exportName} };
`;
    }

    // 写入文件
    fs.writeFileSync(filePath, tsContent, { encoding: opts.encoding });

    return true;
  } catch (error) {
    console.error(
      `保存数据到TS文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * 异步将数据保存为TypeScript文件
 * @param data 要保存的数据
 * @param filePath 文件保存路径
 * @param options 可选配置项
 * @returns Promise<boolean> 保存是否成功的Promise
 */
export async function saveDataToTsFileAsync(
  data: any,
  filePath: string,
  options?: {
    exportName?: string; // 导出变量名
    exportType?: "const" | "let" | "var"; // 导出类型
    exportDefault?: boolean; // 是否默认导出
    typeAnnotation?: string; // 类型注解
    encoding?: BufferEncoding; // 文件编码
    createDir?: boolean; // 如果目录不存在是否创建
    pretty?: boolean; // 是否美化JSON格式
  },
): Promise<boolean> {
  try {
    const opts = {
      exportName: "data",
      exportType: "const" as const,
      exportDefault: false,
      typeAnnotation: ": ServiceData",
      encoding: "utf8" as BufferEncoding,
      createDir: true,
      pretty: true,
      ...options,
    };

    // 确保目录存在
    if (opts.createDir) {
      const dirname = path.dirname(filePath);
      if (!fs.existsSync(dirname)) {
        await fs.promises.mkdir(dirname, { recursive: true });
      }
    }

    // 将数据转换为JSON字符串
    const jsonString = opts.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    // 构建TypeScript内容
    let tsContent = `import type { ServiceData } from "../../types";
`;

    // 添加类型注解
    if (opts.typeAnnotation) {
      tsContent += `${opts.exportType} ${opts.exportName}${opts.typeAnnotation} = ${jsonString};
`;
    } else {
      tsContent += `${opts.exportType} ${opts.exportName} = ${jsonString};
`;
    }

    // 添加默认导出
    if (opts.exportDefault && !opts.exportName.includes("default")) {
      tsContent += `
export default ${opts.exportName};
`;
    } else if (opts.exportDefault) {
      // 如果exportName已经包含default，则不添加额外的默认导出
    } else {
      tsContent += `
export { ${opts.exportName} };
`;
    }

    // 异步写入文件
    await fs.promises.writeFile(filePath, tsContent, {
      encoding: opts.encoding,
    });

    return true;
  } catch (error) {
    console.error(
      `异步保存数据到TS文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

// 使用示例
// export function example() {
//   // 示例数据
//   const exampleData = {
//     name: "五粮液",
//     code: "000858",
//     price: 168.5,
//     date: "2025-09-11",
//     financials: {
//       revenue: 12345678900,
//       profit: 2345678900,
//       assets: 98765432100
//     }
//   };

//   // 保存为JSON文件
//   const savedJson = saveJsonToFile(exampleData, './data/stock-data.json');
//   console.log(`保存JSON ${savedJson ? '成功' : '失败'}`);

//   // 保存为TS文件
//   const savedTs = saveDataToTsFile(exampleData, './data/stock-data.ts', {
//     exportName: 'stockData',
//     typeAnnotation: ': StockData',
//     exportDefault: true
//   });
//   console.log(`保存TS ${savedTs ? '成功' : '失败'}`);

//   // 异步保存为TS文件
//   saveDataToTsFileAsync(exampleData, './data/stock-data-async.ts', {
//     exportName: 'asyncStockData'
//   })
//     .then(result => console.log(`异步保存TS ${result ? '成功' : '失败'}`))
//     .catch(err => console.error('异步保存出错:', err));
// }
