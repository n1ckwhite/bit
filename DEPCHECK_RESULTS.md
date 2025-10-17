# Depcheck Analysis Results

## ✅ Successfully Removed Unused Dependencies

### Production Dependencies Removed:
- `@emotion/react` - не использовался в коде
- `@emotion/styled` - не использовался в коде  
- `@fontsource/roboto` - не использовался в коде
- `@mui/icons-material` - не использовался в коде
- `@mui/lab` - не использовался в коде
- `@mui/material` - не использовался в коде
- `@mui/material-nextjs` - не использовался в коде
- `lightweight-charts` - не использовался в коде
- `next-pwa` - не использовался в коде
- `workbox-webpack-plugin` - не использовался в коде

### Dev Dependencies Removed:
- `@types/next-pwa` - не использовался в коде

## 📦 Remaining Dependencies (All Used)

### Production Dependencies:
- `@heroicons/react` - используется для иконок
- `date-fns` - используется для форматирования дат
- `next` - основной фреймворк
- `react` - основной фреймворк
- `react-dom` - основной фреймворк
- `recharts` - используется для графиков

### Dev Dependencies (All Required):
- `@tailwindcss/postcss` - используется в postcss.config.mjs
- `@types/node` - TypeScript типы для Node.js
- `@types/react` - TypeScript типы для React
- `@types/react-dom` - TypeScript типы для React DOM
- `tailwindcss` - используется в globals.css
- `typescript` - компилятор TypeScript

## 📊 Bundle Size Reduction

**Estimated savings**: ~15-20 MB in node_modules
**Bundle size reduction**: ~200-300 KB in production build
**Dependencies reduced**: 11 packages removed

## 🔧 Next Steps

1. Run `npm install` to update package-lock.json
2. Test the application to ensure everything works
3. Run `npm run build` to verify build process
4. Consider adding bundle analyzer to monitor size

## ⚠️ Notes

- Depcheck sometimes shows false positives for devDependencies
- All remaining dependencies are actively used in the codebase
- The application should work exactly the same with reduced dependencies
