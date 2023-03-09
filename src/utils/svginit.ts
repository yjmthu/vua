// 引入所有svg
const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
const ctx = require.context('@/assets/svg', false, /\.svg$/)
requireAll(ctx)
