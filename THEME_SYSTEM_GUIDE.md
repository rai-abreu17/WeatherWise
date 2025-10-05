# 🌓 Sistema de Troca de Tema (Dark/Light Mode)

## ✨ Funcionalidade

O WeatherWise agora suporta **3 modos de tema**:
- 🌙 **Escuro** (Dark) - Tema padrão
- ☀️ **Claro** (Light) - Tema claro
- 🖥️ **Sistema** (System) - Segue a preferência do sistema operacional

---

## 📁 Arquivos Criados

### **1. src/components/theme-provider.tsx**
Context Provider que gerencia o estado do tema:
- Armazena preferência no `localStorage`
- Aplica classes CSS no elemento `<html>`
- Detecta preferência do sistema automaticamente
- Hook `useTheme()` para acessar e alterar o tema

### **2. src/components/ThemeToggle.tsx**
Componente de UI com dropdown para trocar tema:
- Ícone de sol/lua com animação
- Menu dropdown com 3 opções (Claro, Escuro, Sistema)
- Integrado com shadcn/ui (Button + DropdownMenu)

### **3. src/main.tsx** (Modificado)
Envolve o App com `ThemeProvider`:
```tsx
<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
  <App />
</ThemeProvider>
```

### **4. Integração nas Páginas**
- ✅ `src/pages/Index.tsx` - ThemeToggle no header
- ✅ `src/pages/Results.tsx` - ThemeToggle no header

---

## 🎨 Como Funciona

### **1. Detecção Automática**
```typescript
// Se tema = "system", detecta preferência do OS
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
  .matches ? "dark" : "light"
```

### **2. Persistência**
```typescript
// Salva no localStorage
localStorage.setItem("vite-ui-theme", theme)

// Carrega na inicialização
const savedTheme = localStorage.getItem("vite-ui-theme")
```

### **3. Aplicação de Classes**
```typescript
// Remove classes existentes
root.classList.remove("light", "dark")

// Adiciona classe do tema ativo
root.classList.add(theme)
```

---

## 🚀 Como Usar

### **Para Usuários:**

1. **Acessar qualquer página** (Index ou Results)
2. **Clicar no ícone** de sol/lua no header
3. **Escolher tema:**
   - ☀️ Claro
   - 🌙 Escuro
   - 🖥️ Sistema
4. **Preferência é salva** automaticamente

### **Para Desenvolvedores:**

#### **Usar o hook useTheme:**
```typescript
import { useTheme } from "@/components/theme-provider"

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <button onClick={() => setTheme("dark")}>Modo Escuro</button>
    </div>
  )
}
```

#### **Adicionar ThemeToggle em nova página:**
```typescript
import { ThemeToggle } from "@/components/ThemeToggle"

function NewPage() {
  return (
    <header>
      {/* outros componentes */}
      <ThemeToggle />
    </header>
  )
}
```

---

## 🎯 Classes CSS do Tailwind

O tema é aplicado via classe `.dark` no elemento `<html>`:

### **Exemplo de uso no Tailwind:**
```tsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">
    Este texto muda de cor com o tema
  </h1>
</div>
```

### **Cores do projeto já suportam dark mode:**
- `bg-background` - Fundo adaptável
- `text-foreground` - Texto adaptável
- `border-border` - Bordas adaptáveis
- `text-muted-foreground` - Texto secundário

---

## 🔧 Configuração Avançada

### **Alterar tema padrão:**

Em `src/main.tsx`:
```typescript
<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
  <App />
</ThemeProvider>
```

### **Alterar chave do localStorage:**
```typescript
<ThemeProvider defaultTheme="dark" storageKey="meu-app-theme">
  <App />
</ThemeProvider>
```

### **Desabilitar detecção do sistema:**
Remova a opção "Sistema" do dropdown em `ThemeToggle.tsx`:
```tsx
<DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => setTheme("light")}>
    Claro
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setTheme("dark")}>
    Escuro
  </DropdownMenuItem>
  {/* Remover esta opção */}
</DropdownMenuContent>
```

---

## ✅ Checklist

- [x] ThemeProvider criado
- [x] ThemeToggle criado
- [x] main.tsx atualizado
- [x] Index.tsx integrado
- [x] Results.tsx integrado
- [x] Tema salvo no localStorage
- [x] Ícone animado (sol/lua)
- [x] 3 opções de tema disponíveis

---

## 🧪 Testar

1. **Abra a aplicação** no navegador
2. **Clique no ícone** de sol/lua no header
3. **Teste cada opção:**
   - Claro → Veja o tema mudar
   - Escuro → Veja o tema mudar
   - Sistema → Deve seguir preferência do OS
4. **Recarregue a página** → Tema deve ser mantido
5. **Inspecione elemento** → `<html class="dark">` ou `<html class="light">`

---

## 📚 Recursos Relacionados

- **Tailwind CSS Dark Mode:** https://tailwindcss.com/docs/dark-mode
- **next-themes (biblioteca base):** https://github.com/pacocoursey/next-themes
- **shadcn/ui Theming:** https://ui.shadcn.com/docs/theming

---

**Data de Criação:** 2025-10-04  
**Status:** Totalmente funcional ✅  
**Localização:** Header de todas as páginas principais
