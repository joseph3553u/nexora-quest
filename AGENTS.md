<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep student workspace routes under the `_authenticated` pathless layout because profiles and progress are private.
- Store lesson completion in `course_progress` and derive course percentages from those rows as the single source of truth.
- Keep the shared visual system token-driven so palette changes update every student workspace consistently.
