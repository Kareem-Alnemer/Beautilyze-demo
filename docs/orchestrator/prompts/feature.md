# Prompt — New Feature

Loaded by the agent before starting any task that adds or changes product
behavior.

---

Before I write any code, I need answers to these:

1. **In one sentence, what should happen when this works?**
2. **Which blueprint section does this implement?** (I'll suggest one if
   you're unsure.)
3. **What should I NOT change while doing this?**
4. **Which of these will be affected?** (check all that apply)
   - [ ] The verdict engine (`app/src/verdict/`)
   - [ ] The database schema (`supabase/migrations/`)
   - [ ] The inference server (`inference-server/`)
   - [ ] The mobile app UI (`app/src/screens/`, `app/src/components/`)
   - [ ] The catalog data (`catalog/`)
   - [ ] The design system (`app/src/theme/`)
5. **Tests first, or code first?** (Default: tests first.)
6. **After I finish, do you want to run the tests yourself, or should I?**
7. **Is there a deadline or constraint I should know about?**

I will wait for your answers before doing anything else.

If you say "just do it" without answering, I will pick sensible defaults,
state them explicitly, and proceed.