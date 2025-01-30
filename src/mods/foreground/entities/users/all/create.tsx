import { Color } from "@/libs/colors/colors";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { WideClickableGradientButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { randomUUID } from "@/libs/uuid/uuid";
import { User, UserInit, UserRef } from "@/mods/background/service_worker/entities/users/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale, Localized } from "@/mods/foreground/locale";
import { UserAvatar } from "@/mods/foreground/user/mods/avatar";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { KeyboardEvent, useCallback, useDeferredValue, useMemo, useState } from "react";
import { SimpleInput } from "../../wallets/actions/send";
import { useCurrentUser } from "../data";

export namespace Messages {

  export const PasswordRequired: Localized<string> = {
    en: "Password required",
    zh: "需要密码",
    hi: "पासवर्ड आवश्यक है",
    es: "Se requiere contraseña",
    ar: "كلمة المرور مطلوبة",
    fr: "Mot de passe requis",
    de: "Passwort erforderlich",
    ru: "Требуется пароль",
    pt: "Senha necessária",
    ja: "パスワードが必要です",
    pa: "ਪਾਸਵਰਡ ਦੀ ਲੋੜ ਹੈ",
    bn: "পাসওয়ার্ড প্রয়োজন",
    id: "Kata sandi diperlukan",
    ur: "پاس ورڈ درکار ہے",
    ms: "Kata laluan diperlukan",
    it: "Password richiesta",
    tr: "Parola gerekli",
    ta: "கடவுச்சொல் தேவை",
    te: "పాస్వర్డ్ అవసరం",
    ko: "비밀번호 필요",
    vi: "Yêu cầu mật khẩu",
    pl: "Wymagane hasło",
    ro: "Parolă necesară",
    nl: "Wachtwoord vereist",
    el: "Απαιτείται κωδικός",
    th: "ต้องการรหัสผ่าน",
    cs: "Vyžadováno heslo",
    hu: "Jelszó szükséges",
    sv: "Lösenord krävs",
    da: "Adgangskode påkrævet",
  }

  export const PasswordTooShort: Localized<string> = {
    en: "Password too short",
    zh: "密码太短",
    hi: "पासवर्ड बहुत छोटा है",
    es: "Contraseña demasiado corta",
    ar: "كلمة السر قصيرة جدا",
    fr: "Mot de passe trop court",
    de: "Passwort zu kurz",
    ru: "Пароль слишком короткий",
    pt: "Senha muito curta",
    ja: "パスワードが短すぎます",
    pa: "ਪਾਸਵਰਡ ਬਹੁਤ ਛੋਟਾ ਹੈ",
    bn: "পাসওয়ার্ড খুব ছোট",
    id: "Kata sandi terlalu pendek",
    ur: "پاس ورڈ بہت چھوٹا ہے",
    ms: "Kata laluan terlalu pendek",
    it: "Password troppo corta",
    tr: "Parola çok kısa",
    ta: "கடவுச்சொல் மிகவும் குறைந்தது",
    te: "పాస్వర్డ్ చాలా చిన్నది",
    ko: "비밀번호가 너무 짧습니다",
    vi: "Mật khẩu quá ngắn",
    pl: "Hasło jest za krótkie",
    ro: "Parola prea scurtă",
    nl: "Wachtwoord te kort",
    el: "Ο κωδικός είναι πολύ μικρός",
    th: "รหัสผ่านสั้นเกินไป",
    cs: "Heslo je příliš krátké",
    hu: "A jelszó túl rövid",
    sv: "Lösenordet är för kort",
    da: "Adgangskoden er for kort",
  }

  export const PasswordsDontMatch: Localized<string> = {
    en: "Passwords don't match",
    zh: "密码不匹配",
    hi: "पासवर्ड मेल नहीं खाते",
    es: "Las contraseñas no coinciden",
    ar: "كلمات السر غير متطابقة",
    fr: "Les mots de passe ne correspondent pas",
    de: "Passwörter stimmen nicht überein",
    ru: "Пароли не совпадают",
    pt: "Senhas não correspondem",
    ja: "パスワードが一致しません",
    pa: "ਪਾਸਵਰਡ ਮੈਚ ਨਹੀਂ ਕਰਦੇ",
    bn: "পাসওয়ার্ড মিলছে না",
    id: "Kata sandi tidak cocok",
    ur: "پاس ورڈ میچ نہیں ہوتے",
    ms: "Kata laluan tidak sepadan",
    it: "Le password non corrispondono",
    tr: "Parolalar uyuşmuyor",
    ta: "கடவுச்சொல்கள் பொருந்தவில்லை",
    te: "పాస్వర్డ్లు పొరపడవు",
    ko: "비밀번호가 일치하지 않습니다",
    vi: "Mật khẩu không khớp",
    pl: "Hasła nie pasują",
    ro: "Parolele nu se potrivesc",
    nl: "Wachtwoorden komen niet overeen",
    el: "Οι κωδικοί δεν ταιριάζουν",
    th: "รหัสผ่านไม่ตรงกัน",
    cs: "Hesla se neshodují",
    hu: "A jelszavak nem egyeznek",
    sv: "Lösenorden matchar inte",
    da: "Adgangskoderne stemmer ikke overens",
  }

}

export function UserCreateDialog(props: { next?: string }) {
  const close = useCloseContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()

  const uuid = useConstant(() => randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const finalNameInput = useMemo(() => {
    return defNameInput || "John Doe"
  }, [defNameInput])

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawPasswordInput = "", setRawPasswordInput] = useState<string>()

  const defPasswordInput = useDeferredValue(rawPasswordInput)

  const onPasswordInputChange = useInputChange(e => {
    setRawPasswordInput(e.currentTarget.value)
  }, [])

  const [rawConfirmPasswordInput = "", setRawConfirmPasswordInput] = useState<string>()

  const defConfirmPasswordInput = useDeferredValue(rawConfirmPasswordInput)

  const onConfirmPasswordInputChange = useInputChange(e => {
    setRawConfirmPasswordInput(e.currentTarget.value)
  }, [])

  const createOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const user: UserInit = { uuid, name: finalNameInput, color: Color.all.indexOf(color), password: defPasswordInput }

    await background.requestOrThrow<User[]>({
      method: "brume_createUser",
      params: [user]
    }).then(r => r.getOrThrow())

    await background.requestOrThrow({
      method: "brume_login",
      params: [user.uuid, defPasswordInput]
    }).then(r => r.getOrThrow())

    await currentUserQuery.mutateOrThrow(() => new Some(new Data(UserRef.create(user.uuid))))

    close(true)

    if (next != null)
      location.assign(next)

    return
  }), [uuid, finalNameInput, color, defPasswordInput, background, close, next])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return
    e.preventDefault()

    createOrAlert.run()
  }, [createOrAlert])

  const error = useMemo(() => {
    if (defPasswordInput.length < 1)
      return Locale.get(Messages.PasswordRequired, locale)
    if (defPasswordInput.length < 3)
      return Locale.get(Messages.PasswordTooShort, locale)
    if (defConfirmPasswordInput.length < 1)
      return Locale.get(Messages.PasswordRequired, locale)
    if (defConfirmPasswordInput.length < 3)
      return Locale.get(Messages.PasswordTooShort, locale)
    if (defPasswordInput !== defConfirmPasswordInput)
      return Locale.get(Messages.PasswordsDontMatch, locale)
  }, [locale, defConfirmPasswordInput, defPasswordInput])

  const NameInput =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Name, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="John Doe"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </ContrastLabel>

  const PasswordInput =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Password, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        type="password"
        placeholder=""
        value={rawPasswordInput}
        onChange={onPasswordInputChange} />
    </ContrastLabel>

  const PasswordInput2 =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Password, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        type="password"
        placeholder=""
        value={rawConfirmPasswordInput}
        onChange={onConfirmPasswordInputChange}
        onKeyDown={onKeyDown} />
    </ContrastLabel>

  const DoneButton =
    <WideClickableGradientButton
      disabled={error != null}
      onClick={createOrAlert.run}
      color={color}>
      <Outline.PlusIcon className="size-5" />
      {error || "Add"}
    </WideClickableGradientButton>

  return <>
    <Dialog.Title>
      {Locale.get(Locale.NewUser, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center h-[200px]">
      <UserAvatar className="size-16 text-2xl"
        name={finalNameInput}
        color={color} />
      <div className="h-2" />
      <div className="font-medium">
        {finalNameInput}
      </div>
    </div>
    <div className="h-2" />
    {NameInput}
    <div className="h-2" />
    {PasswordInput}
    <div className="h-2" />
    {PasswordInput2}
    <div className="h-4" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {DoneButton}
    </div>
  </>
}