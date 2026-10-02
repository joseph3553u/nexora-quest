-- Lets the sign-in screen tell "no account yet" apart from "wrong password".
-- Note: this intentionally reveals whether an email is registered.
CREATE OR REPLACE FUNCTION public.auth_account_status(_email text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE _user auth.users%ROWTYPE; _has_password boolean;
BEGIN
  SELECT * INTO _user FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF NOT FOUND THEN RETURN 'none'; END IF;
  IF _user.email_confirmed_at IS NULL THEN RETURN 'unconfirmed'; END IF;
  _has_password := EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = _user.id AND provider = 'email'
  );
  IF NOT _has_password THEN RETURN 'oauth_only'; END IF;
  RETURN 'password';
END $$;
REVOKE EXECUTE ON FUNCTION public.auth_account_status(text) FROM public;
GRANT EXECUTE ON FUNCTION public.auth_account_status(text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_or_join_room(text, text) TO authenticated;
