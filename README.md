# 添加公司财务数据

1. `/types/stocks` 目录下按行业进行分类，不知道怎么分类的直接放到 `other.ts` 中，估值配置不知道怎么写可以随便写个股息率类型，并且股息率为 `0.05`
2. 添加好公司配置后，在 `types/stocks.ts` 中进行引入
3. 运行命令更新数据
   - `pnpm run fetch-data` 获取财务源数据，源数据放在 `/data/` 目录下，比较大，因此不会推上去
   - `pnpm run handle-data` 根据已有财务源数据生成处理后的数据
   - `pnpm run update-data` 获取财务数据并且处理数据，获取动态数据（如实时股价等）
   - `pnpm run force-update` 强制更新所有数据（确保把所有数据更新到最新，一般有新财报出来后使用，`update-data`会比对`/data/`和`/types/stocks.ts`找出没添加过的公司进行更新，添加过的公司不会更新，所以有新数据时需要使用 `force-update`）
   - `pnpm run update-dynamic` 更新实时数据，之所以分开是因为这个是获取高频数据，财务数据是低频数据
