import { useState } from 'react'
import { Plus } from 'lucide-react'

import {
  getContentDefinitions,
  type BlockType,
} from '../../content/contentRegistry'

interface BlockPickerProps {
  onSelect: (
    type: BlockType,
  ) => Promise<void> | void
}

function BlockPicker({
  onSelect,
}: BlockPickerProps) {
  const [open, setOpen] =
    useState(false)

  const blockTypes =
    getContentDefinitions('block')

  const handleSelect = async (
    type: BlockType,
  ) => {
    await onSelect(type)

    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-app-muted transition hover:bg-app-hover hover:text-general"
      >
        <Plus size={17} />

        Thêm nội dung
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-40 w-72 rounded-xl border border-app-border bg-white p-2 shadow-xl">
          {blockTypes.map(
            ({
              type,
              label,
              description,
              icon: Icon,
            }) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  handleSelect(
                    type as BlockType,
                  )
                }
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-app-hover"
              >
                <Icon
                  size={19}
                  className="shrink-0 text-app-muted"
                />

                <div>
                  <p className="text-sm font-medium">
                    {label}
                  </p>

                  <p className="text-xs text-app-muted">
                    {description}
                  </p>
                </div>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default BlockPicker