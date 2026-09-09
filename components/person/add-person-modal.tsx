"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Field, Select, TextArea, TextInput } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PhotoUploader } from "@/components/person/photo-uploader";
import { cardName } from "@/lib/format";
import type { ConnectionChoice, PersonDraft } from "@/lib/types";
import { emptyPersonDraft } from "@/lib/types";
import { useTreeStore } from "@/store/use-tree-store";

const CONNECTIONS: { id: ConnectionChoice; label: string }[] = [
  { id: "parent", label: "Parent" },
  { id: "child", label: "Child" },
  { id: "spouse", label: "Spouse / Partner" },
  { id: "sibling", label: "Sibling" },
  { id: "grandparent", label: "Grandparent" },
  { id: "grandchild", label: "Grandchild" },
  { id: "other", label: "Other relative" },
];

const QUICK: ConnectionChoice[] = ["parent", "spouse", "sibling", "child"];

export function AddPersonModal() {
  const open = useTreeStore((s) => s.addPersonOpen);
  const context = useTreeStore((s) => s.addPersonContext);
  const closeAddPerson = useTreeStore((s) => s.closeAddPerson);
  const people = useTreeStore((s) => s.people);
  const addPersonWithConnection = useTreeStore((s) => s.addPersonWithConnection);
  const startOnboardingSelf = useTreeStore((s) => s.startOnboardingSelf);
  const onboardingStep = useTreeStore((s) => s.onboardingStep);
  const selectedPersonId = useTreeStore((s) => s.selectedPersonId);
  const openAddPerson = useTreeStore((s) => s.openAddPerson);
  const finishOnboarding = useTreeStore((s) => s.finishOnboarding);

  const isEmpty = people.length === 0;
  const anchor = people.find((p) => p.id === (context?.anchorId || selectedPersonId));
  const [step, setStep] = useState<"connect" | "form">(context?.connection || isEmpty ? "form" : "connect");
  const [connection, setConnection] = useState<ConnectionChoice | undefined>(context?.connection);
  const [relatedTo, setRelatedTo] = useState(context?.anchorId || selectedPersonId || "");
  const [draft, setDraft] = useState<PersonDraft>(emptyPersonDraft());
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initialConnection = context?.connection;
    setConnection(initialConnection);
    setRelatedTo(context?.anchorId || selectedPersonId || people[0]?.id || "");
    setDraft(emptyPersonDraft());
    setMore(false);
    setStep(isEmpty || initialConnection ? "form" : "connect");
  }, [open, context, selectedPersonId, people, isEmpty]);

  const relatedPerson = people.find((p) => p.id === relatedTo);
  const title = isEmpty
    ? "Add yourself"
    : relatedPerson && (connection || step === "connect")
      ? `Add relative to ${cardName(relatedPerson)}`
      : "Add someone to your family tree";

  const canSubmit = draft.firstName.trim().length > 0;

  const connectionLabel = useMemo(
    () => CONNECTIONS.find((c) => c.id === (connection === "partner" ? "spouse" : connection))?.label,
    [connection],
  );

  if (onboardingStep === "next" && people.length === 1) {
    const self = people[0];
    return (
      <Modal open={open || true} onClose={finishOnboarding} title="Who would you like to add next?">
        <div className="grid grid-cols-2 gap-2">
          {QUICK.map((id) => (
            <button
              key={id}
              type="button"
              className="rounded-2xl border border-line bg-white px-4 py-4 text-sm capitalize hover:border-forest hover:bg-sage-soft"
              onClick={() => {
                finishOnboarding();
                openAddPerson({ anchorId: self.id, connection: id });
              }}
            >
              {id}
            </button>
          ))}
        </div>
        <button type="button" className="mt-4 w-full text-sm text-soft hover:text-charcoal" onClick={finishOnboarding}>
          I’ll add someone later
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={closeAddPerson}
      title={
        isEmpty
          ? "Add yourself"
          : relatedPerson && context?.anchorId
            ? `Add relative to ${cardName(relatedPerson)}`
            : "Add someone to your family tree"
      }
      subtitle={
        isEmpty
          ? "Start with you. You can add parents, a partner, and children next."
          : relatedPerson && connection
            ? `${connectionLabel} of ${cardName(relatedPerson)}`
            : "How are they connected?"
      }
      wide={step === "form"}
    >
      {isEmpty && step === "form" ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            startOnboardingSelf(draft);
          }}
        >
          <PhotoUploader
            value={draft.profilePhotoUrl}
            onChange={(profilePhotoUrl) => setDraft((d) => ({ ...d, profilePhotoUrl }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <TextInput
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Last name">
              <TextInput value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label="Birth year" hint="You can add the full date later.">
            <TextInput
              inputMode="numeric"
              placeholder="1988"
              value={draft.birthDate}
              onChange={(e) => {
                const year = e.target.value.replace(/\D/g, "").slice(0, 4);
                setDraft({ ...draft, birthDate: year.length === 4 ? `${year}-01-01` : year });
              }}
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            Add yourself
          </Button>
        </form>
      ) : null}

      {!isEmpty && step === "connect" ? (
        <div className="space-y-5">
          <p className="text-sm text-soft">How are they connected?</p>
          {people.length > 1 ? (
            <Field label="Related to">
              <Select value={relatedTo} onChange={(e) => setRelatedTo(e.target.value)}>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {cardName(person)}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {(context?.anchorId && !context.connection
              ? CONNECTIONS.filter((item) => QUICK.includes(item.id) || item.id === "spouse")
              : CONNECTIONS
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className="min-h-14 rounded-2xl border border-line bg-white px-4 py-3 text-left text-sm hover:border-forest hover:bg-sage-soft"
                onClick={() => {
                  setConnection(item.id === "spouse" ? "spouse" : item.id);
                  setStep("form");
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!isEmpty && step === "form" ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            addPersonWithConnection(draft, {
              anchorId: relatedTo || context?.anchorId,
              connection: connection || context?.connection || "other",
            });
          }}
        >
          {relatedPerson && !connection ? (
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setConnection(id)}
                  className="rounded-2xl border border-line bg-white px-3 py-3 text-sm capitalize hover:border-forest hover:bg-sage-soft"
                >
                  {id}
                </button>
              ))}
            </div>
          ) : null}
          <PhotoUploader
            value={draft.profilePhotoUrl}
            onChange={(profilePhotoUrl) => setDraft((d) => ({ ...d, profilePhotoUrl }))}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="First name">
              <TextInput
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Middle name">
              <TextInput value={draft.middleName} onChange={(e) => setDraft({ ...draft, middleName: e.target.value })} />
            </Field>
            <Field label="Last name">
              <TextInput
                value={draft.lastName}
                onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                placeholder={relatedPerson?.lastName}
              />
            </Field>
          </div>
          <Field label="Preferred name">
            <TextInput value={draft.preferredName} onChange={(e) => setDraft({ ...draft, preferredName: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Birth date">
              <TextInput type="date" value={draft.birthDate} onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })} />
            </Field>
            <Field label="Death date">
              <TextInput type="date" value={draft.deathDate} onChange={(e) => setDraft({ ...draft, deathDate: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value as PersonDraft["gender"] })}>
                <option value="unknown">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Nonbinary</option>
              </Select>
            </Field>
          </div>
          <button
            type="button"
            className="text-sm text-forest hover:underline"
            onClick={() => setMore((v) => !v)}
          >
            {more ? "Hide extra details" : "Add more details"}
          </button>
          {more ? (
            <div className="space-y-3 rounded-2xl bg-white p-4">
              <Field label="Birthplace">
                <TextInput value={draft.birthPlace} onChange={(e) => setDraft({ ...draft, birthPlace: e.target.value })} />
              </Field>
              <Field label="Current location">
                <TextInput value={draft.currentLocation} onChange={(e) => setDraft({ ...draft, currentLocation: e.target.value })} />
              </Field>
              <Field label="Occupation">
                <TextInput value={draft.occupation} onChange={(e) => setDraft({ ...draft, occupation: e.target.value })} />
              </Field>
              <Field label="Education">
                <TextInput value={draft.education} onChange={(e) => setDraft({ ...draft, education: e.target.value })} />
              </Field>
              <Field label="Biography">
                <TextArea value={draft.biography} onChange={(e) => setDraft({ ...draft, biography: e.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email">
                  <TextInput type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <TextInput value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Website">
                <TextInput value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
              </Field>
            </div>
          ) : null}
          <div className="flex gap-3">
            {!context?.connection ? (
              <Button type="button" variant="secondary" onClick={() => setStep("connect")}>
                Back
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              Add to family tree
            </Button>
          </div>
        </form>
      ) : null}
      <span className="sr-only">{title}</span>
    </Modal>
  );
}
