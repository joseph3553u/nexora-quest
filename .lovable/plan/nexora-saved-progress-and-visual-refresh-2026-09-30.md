# Nexora saved progress and visual refresh

## What will change

- Add a simple sign-in screen so each student’s progress belongs only to them.
- Save lesson completion and course progress in Lovable Cloud instead of resetting on refresh.
- Load saved progress into both the Dashboard and Learning Center, with clear loading, saved, and retry states.
- Restyle the app around the selected **Bento Glass Workspace** direction using the locked Neon Mint palette, Sora headings, and Manrope body text.
- Apply restrained frosted surfaces, thin mint borders, glowing progress/status accents, and a cleaner bento hierarchy across the shared shell and pages.
- Preserve every existing page, navigation item, filter, form, and local demo dataset.

## Experience

- Signed-out students see a focused Nexora sign-in screen.
- Signed-in students can tick lessons; completion updates immediately and syncs to the backend.
- Dashboard course percentages reflect the same saved lesson state.
- Desktop keeps the full sidebar; mobile keeps its drawer and bottom navigation.
- Motion remains subtle and respects reduced-motion preferences.

## Technical details

- Enable email/password and managed Google sign-in.
- Create a private `course_progress` table with row-level access limited to the signed-in student, including explicit authenticated and service grants.
- Use authenticated server functions for progress reads/writes, with the existing bearer middleware.
- Add the managed authenticated route boundary and keep the public auth screen separate.
- Replace the current violet tokens with semantic Neon Mint dark-glass tokens; no hardcoded component colors.
- Verify database policies, app build, signed-in lesson updates, refresh persistence, and desktop/mobile layouts.

## Scope boundary

- Only course and lesson progress becomes persistent in this pass; other demo actions remain local as requested by the original MVP scope.
