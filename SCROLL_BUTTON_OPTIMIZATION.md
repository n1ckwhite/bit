# Оптимизация кнопки "Наверх"

## ✅ Проблема решена

### **Что было изменено:**

#### **1. Добавлено состояние для отслеживания прокрутки:**
```typescript
const [showScrollButton, setShowScrollButton] = useState(false);
```

#### **2. Добавлен эффект для отслеживания прокрутки:**
```typescript
useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setShowScrollButton(scrollTop > 300); // Show button after scrolling 300px
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

#### **3. Обновлена кнопка с условным отображением:**
```typescript
<button
  onClick={scrollToTop}
  className={`fixed bottom-6 right-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
    showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
  }`}
  title="Наверх"
>
  <ChevronUpIcon className="w-5 h-5" />
</button>
```

### **Результат:**

- ✅ **Кнопка скрыта по умолчанию**: `opacity-0 translate-y-4 pointer-events-none`
- ✅ **Появляется при прокрутке**: После прокрутки на 300px вниз
- ✅ **Плавная анимация**: `transition-all duration-200`
- ✅ **Оптимизированная производительность**: `{ passive: true }` для scroll listener

### **Поведение:**
1. **При загрузке**: Кнопка полностью скрыта
2. **При прокрутке вниз**: После 300px кнопка плавно появляется
3. **При прокрутке вверх**: Кнопка плавно исчезает
4. **При клике**: Плавная прокрутка наверх

Теперь кнопка "Наверх" ведет себя правильно и не отображается сразу при загрузке страницы! 🎯
