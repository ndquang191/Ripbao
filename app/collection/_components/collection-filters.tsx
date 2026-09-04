"use client";

import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { type Filters } from "../_lib/models";
import { SearchBox } from "./editor-inputs";

export function CollectionFilters({
  query,
  setQuery,
  values,
  setValues,
  options,
}: {
  query: string;
  setQuery: (value: string) => void;
  values: string[];
  setValues: (values: string[]) => void;
  options: Filters;
}) {
  const set = (index: number, value: string) =>
    setValues(
      values.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  return (
    <div className="mb-4 grid gap-2 rounded-sm border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_repeat(4,140px)]">
      <SearchBox
        value={query}
        set={setQuery}
        placeholder="Tìm trong collection..."
      />
      <FilterDropdown
        label="Set"
        value={values[0]}
        options={options.sets}
        onChange={(x) => set(0, x)}
      />
      <FilterDropdown
        label="Loại"
        value={values[1]}
        options={options.types}
        onChange={(x) => set(1, x)}
      />
      <FilterDropdown
        label="Độ hiếm"
        value={values[2]}
        options={options.rarities}
        onChange={(x) => set(2, x)}
      />
      <DomainFilter
        value={values[3]}
        options={options.domains}
        onChange={(x) => set(3, x)}
      />
    </div>
  );
}
