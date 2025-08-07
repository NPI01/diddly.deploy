# Writing Assistant - AI-Powered Content Creation Platform

A powerful writing assistant app built for Substack writers and content creators, featuring AI agents for editing, writing assistance, research, and growth optimization.

## 🚀 Features

### Core Writing Experience
- **Clean, Minimal Editor**: Distraction-free writing interface with auto-save
- **Real-time Word Count**: Track your progress as you write
- **Article Management**: Organize drafts and published articles

### AI Writing Agents
- **Edit & Revise (E&R) Levels 1-3**: From light touch to aggressive rewrites
- **Writing Agent**: Develop incomplete ideas into full articles
- **Research Agent**: Enhance articles with supporting evidence and data
- **Growth Agent**: Optimize headlines, CTAs, and social media snippets

### Multi-Platform Publishing
- **Substack**: Direct publishing with session-based authentication
- **Ghost**: API-based publishing with full feature support
- **Medium**: OAuth-based publishing with tag support

### Growth & Analytics
- **Performance Tracking**: Monitor open rates, click rates, and engagement
- **Headline Optimization**: AI-generated headline variants
- **Social Media Integration**: Auto-generate Twitter threads and snippets
- **Content Calendar**: Plan and schedule future articles

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **AI/LLM**: vLLM with Qwen3-Coder-30B model, OpenAI GPT-4, Anthropic Claude (configurable)
- **Publishing**: Puppeteer (Substack), REST APIs (Ghost, Medium)
- **Payments**: Stripe (for future subscription features)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI or Anthropic API key

### Setup

1. **Clone and install dependencies**
```bash
git clone <your-repo>
cd writing-assistant
npm install
```

2. **Set up environment variables**
```bash
cp env.example .env.local
```

Fill in your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Configuration (vLLM endpoint)
NEXT_PUBLIC_LLM_API_URL=https://second-stud-free-jointly.ngrok-free.app

# Optional: Fallback LLM providers
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Publishing Platforms
GHOST_API_URL=https://your-ghost-site.com
GHOST_ADMIN_KEY=your_ghost_admin_key
MEDIUM_ACCESS_TOKEN=your_medium_token

# Optional: Research Agent
BRAVE_SEARCH_API_KEY=your_brave_search_key
```

3. **Set up Supabase database**
```bash
# Copy the SQL from supabase/schema.sql and run it in your Supabase SQL editor
```

4. **Set up Substack authentication (optional)**
```bash
npm run setup-substack
```
This will open a browser where you log in to Substack manually, then save your session cookies.

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to start writing!

## 🎯 Usage

### Creating Your First Article
1. Click "New Article" on the dashboard
2. Start writing in the clean, minimal editor
3. Use AI agents to enhance your content:
   - **E&R Level 1**: Light grammar and clarity fixes
   - **E&R Level 2**: Moderate structural improvements  
   - **E&R Level 3**: Aggressive rewrites and optimization
   - **Develop More**: Expand incomplete ideas
   - **Research More**: Add supporting evidence and data

### Publishing
1. Click "Publish" in the editor
2. Select your target platforms (Substack, Ghost, Medium)
3. Add tags and configure settings
4. Hit "Publish" to go live on all selected platforms

### Growth Optimization
1. Use the Growth Agent to analyze your content
2. Get AI-generated headline variants
3. Receive social media snippets for promotion
4. Track performance across platforms

## 🧠 AI Agent Prompts

The app includes carefully crafted prompts for each agent type:

- **Editor Agent**: Maintains your voice while improving clarity and flow
- **Writing Agent**: Develops incomplete ideas into full, coherent articles
- **Research Agent**: Adds credible supporting information and examples
- **Growth Agent**: Optimizes for engagement and subscriber growth

All agents include feedback loops to improve over time based on your ratings and preferences.

## 🔧 Configuration

### LLM Providers
The app supports multiple LLM providers:
- **vLLM with Qwen3-Coder-30B** (default, optimized for concurrent requests)
- OpenAI GPT-4 (fallback)
- Anthropic Claude (fallback)
- Local models via LM Studio/Ollama

The vLLM setup allows for efficient concurrent processing of multiple AI agent requests, significantly improving performance when using multiple agents simultaneously.

Configure in `lib/llm/client.ts` and your environment variables.

### Publishing Platforms

#### Substack
Requires session cookies (run `npm run setup-substack`)

#### Ghost  
Requires Admin API key from your Ghost admin panel

#### Medium
Requires Integration Token from Medium settings

## 📊 Database Schema

The app uses a PostgreSQL database with the following key tables:
- `profiles`: User profiles and subscription status
- `articles`: Article content and metadata
- `agent_interactions`: AI agent usage history and feedback
- `article_metrics`: Performance tracking per platform
- `publishing_history`: Multi-platform publishing logs

## 🚦 Roadmap

### Phase 1 (Current)
- [x] Core writing interface
- [x] AI agent system
- [x] Multi-platform publishing
- [x] Basic analytics

### Phase 2 (Planned)
- [ ] User authentication and multi-user support
- [ ] Advanced analytics dashboard  
- [ ] Collaborative editing
- [ ] Content calendar with scheduling

### Phase 3 (Future)
- [ ] Team workspaces
- [ ] Custom AI agent training
- [ ] Advanced SEO optimization
- [ ] Revenue tracking and monetization tools

## 🎨 Domain Name Ideas

**Minimal & Creative:**
- DraftKit
- WriteOps  
- Penloop
- QuillBox
- GlyphPad
- MusePaper

**Literary Feel:**
- WordKiln
- InkThread
- Scriptorium
- DraftEngine
- StoryGlass
- TheScriptor

**Agent-Themed:**
- EditPilot
- AgentWrite
- WordPilot
- CodexEditor
- ScriboBot
- EditScope

## 🤝 Contributing

This is currently a personal project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

---

**Happy Writing!** ✍️