"use client";

import { startTransition, type FormEvent } from "react";

/** React сбрасывает форму после action — при ошибке валидации ввод потерялся бы. */
export function keepValuesOnSubmit(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
