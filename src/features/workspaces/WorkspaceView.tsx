import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PageEditor from '../pages/PageEditor'

import {
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import { db } from '../../db/database'

import { categoryRepository } from '../../db/repositories/categoryRepository'
import { pageRepository } from '../../db/repositories/pageRepository'

import NameModal from '../../components/common/NameModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'

import type { Workspace } from '../../types/workspace'
import type { Category } from '../../types/category'
import type { Page as WorkspacePage } from '../../types/page'

interface WorkspaceViewProps {
  workspace: Workspace
}

function WorkspaceView({
  workspace,
}: WorkspaceViewProps) {
  const categories =
    useLiveQuery(
      () =>
        db.categories
          .where('workspaceId')
          .equals(workspace.id)
          .sortBy('order'),
      [workspace.id],
    ) ?? []

  const pages =
    useLiveQuery(
      () =>
        db.pages
          .where('workspaceId')
          .equals(workspace.id)
          .sortBy('order'),
      [workspace.id],
    ) ?? []

  const [activePageId, setActivePageId] =
    useState<string | null>(null)

  const [openMenu, setOpenMenu] =
    useState<string | null>(null)

  const [categoryModal, setCategoryModal] =
    useState<{
      mode: 'create' | 'edit'
      category?: Category
    } | null>(null)

  const [pageModal, setPageModal] =
    useState<{
      mode: 'create' | 'edit'
      categoryId?: string
      page?: WorkspacePage
    } | null>(null)

  const [categoryToDelete, setCategoryToDelete] =
    useState<Category | null>(null)

  const [pageToDelete, setPageToDelete] =
    useState<WorkspacePage | null>(null)

  const activePage =
    pages.find((page) => page.id === activePageId) ??
    null

  const handleCategorySubmit = async (
    name: string,
  ) => {
    if (categoryModal?.mode === 'edit') {
      if (!categoryModal.category) {
        return
      }

      await categoryRepository.update(
        categoryModal.category.id,
        name,
      )

      return
    }

    await categoryRepository.create(
      workspace.id,
      name,
    )
  }

  const handlePageSubmit = async (
    title: string,
  ) => {
    if (pageModal?.mode === 'edit') {
      if (!pageModal.page) {
        return
      }

      await pageRepository.update(
        pageModal.page.id,
        title,
      )

      return
    }

    if (!pageModal?.categoryId) {
      return
    }

    const page = await pageRepository.create(
      workspace.id,
      pageModal.categoryId,
      title,
    )

    setActivePageId(page.id)
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) {
      return
    }

    const pageBelongsToCategory =
      pages.some(
        (page) =>
          page.id === activePageId &&
          page.categoryId === categoryToDelete.id,
      )

    await categoryRepository.remove(
      categoryToDelete.id,
    )

    if (pageBelongsToCategory) {
      setActivePageId(null)
    }
  }

  const handleDeletePage = async () => {
    if (!pageToDelete) {
      return
    }

    await pageRepository.remove(pageToDelete.id)

    if (activePageId === pageToDelete.id) {
      setActivePageId(null)
    }
  }

  return (
    <>
      <div className="flex h-full min-h-0">

        {/* Category + Page navigation */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-app-border bg-white">
          <div className="border-b border-app-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Nội dung
                </h2>

                <p className="mt-0.5 text-xs text-app-muted">
                  Danh mục & trang
                </p>
              </div>

              <button
                type="button"
                title="Tạo danh mục"
                onClick={() =>
                  setCategoryModal({
                    mode: 'create',
                  })
                }
                className="rounded-lg p-2 text-app-muted transition hover:bg-app-hover hover:text-general"
              >
                <FolderPlus size={19} />
              </button>
            </div>
          </div>

          <div className="p-3">
            {categories.length === 0 && (
              <div className="px-3 py-8 text-center">
                <Folder
                  size={28}
                  className="mx-auto text-app-muted"
                />

                <p className="mt-3 text-sm font-medium">
                  Chưa có danh mục
                </p>

                <p className="mt-1 text-xs leading-5 text-app-muted">
                  Tạo danh mục để bắt đầu tổ chức
                  các Page của bạn.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setCategoryModal({
                      mode: 'create',
                    })
                  }
                  className="mt-4 rounded-lg bg-general px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  Tạo danh mục
                </button>
              </div>
            )}

            {categories.map((category) => {
              const categoryPages =
                pages.filter(
                  (page) =>
                    page.categoryId === category.id,
                )

              return (
                <div
                  key={category.id}
                  className="mb-3"
                >
                  <div className="group flex items-center gap-1 rounded-lg px-2 py-2">
                    <ChevronRight
                      size={16}
                      className="text-app-muted"
                    />

                    <Folder
                      size={17}
                      className="text-general"
                    />

                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {category.name}
                    </span>

                    <button
                      type="button"
                      title="Thêm Page"
                      onClick={() =>
                        setPageModal({
                          mode: 'create',
                          categoryId: category.id,
                        })
                      }
                      className="rounded-md p-1 text-app-muted opacity-0 transition hover:bg-app-hover hover:text-general group-hover:opacity-100"
                    >
                      <Plus size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === category.id
                            ? null
                            : category.id,
                        )
                      }
                      className="rounded-md p-1 text-app-muted opacity-0 transition hover:bg-app-hover group-hover:opacity-100"
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {openMenu === category.id && (
                      <div className="absolute z-30 mt-28 w-40 rounded-xl border border-app-border bg-white p-1.5 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryModal({
                              mode: 'edit',
                              category,
                            })

                            setOpenMenu(null)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-app-hover"
                        >
                          <Pencil size={15} />
                          Đổi tên
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCategoryToDelete(
                              category,
                            )

                            setOpenMenu(null)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="ml-7 space-y-1">
                    {categoryPages.map((page) => (
                      <div
                        key={page.id}
                        className="group relative"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActivePageId(page.id)
                            setOpenMenu(null)
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-9 text-left text-sm transition ${
                            activePageId === page.id
                              ? 'bg-general/10 font-medium text-general'
                              : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                          }`}
                        >
                          <FileText
                            size={16}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {page.title}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()

                            setOpenMenu((current) =>
                              current === page.id
                                ? null
                                : page.id,
                            )
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-app-muted opacity-0 hover:bg-white group-hover:opacity-100"
                        >
                          <MoreHorizontal
                            size={15}
                          />
                        </button>

                        {openMenu === page.id && (
                          <div className="absolute right-0 top-9 z-30 w-40 rounded-xl border border-app-border bg-white p-1.5 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setPageModal({
                                  mode: 'edit',
                                  page,
                                })

                                setOpenMenu(null)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-app-hover"
                            >
                              <Pencil size={15} />
                              Đổi tên
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPageToDelete(page)
                                setOpenMenu(null)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {categoryPages.length === 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPageModal({
                            mode: 'create',
                            categoryId: category.id,
                          })
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-app-muted transition hover:bg-app-hover hover:text-general"
                      >
                        <Plus size={14} />
                        Thêm Page
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Page area */}
        <section className="min-w-0 flex-1 overflow-y-auto bg-app-bg">
        {activePage ? (
            <PageEditor
            key={activePage.id}
            page={activePage}
            />
        ) : (
            <div className="flex h-full min-h-[500px] items-center justify-center p-8 text-center">
            <div>
                <FileText
                size={42}
                strokeWidth={1.5}
                className="mx-auto text-app-muted"
                />

                <h2 className="mt-4 text-lg font-semibold">
                Chọn một Page
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-app-muted">
                Chọn Page bên trái hoặc tạo
                một Page mới để bắt đầu ghi
                nội dung.
                </p>
            </div>
            </div>
        )}
        </section>
      </div>

      <NameModal
        open={categoryModal !== null}
        title={
          categoryModal?.mode === 'edit'
            ? 'Đổi tên danh mục'
            : 'Tạo danh mục'
        }
        label="Tên danh mục"
        placeholder="Ví dụ: Vocabulary"
        initialValue={
          categoryModal?.category?.name ?? ''
        }
        submitText={
          categoryModal?.mode === 'edit'
            ? 'Lưu thay đổi'
            : 'Tạo danh mục'
        }
        onClose={() => setCategoryModal(null)}
        onSubmit={handleCategorySubmit}
      />

      <NameModal
        open={pageModal !== null}
        title={
          pageModal?.mode === 'edit'
            ? 'Đổi tên Page'
            : 'Tạo Page'
        }
        label="Tên Page"
        placeholder="Ví dụ: Day 1"
        initialValue={
          pageModal?.page?.title ?? ''
        }
        submitText={
          pageModal?.mode === 'edit'
            ? 'Lưu thay đổi'
            : 'Tạo Page'
        }
        onClose={() => setPageModal(null)}
        onSubmit={handlePageSubmit}
      />

      <ConfirmDialog
        open={categoryToDelete !== null}
        title="Xóa danh mục?"
        description={`Danh mục "${
          categoryToDelete?.name ?? ''
        }" và toàn bộ Page bên trong sẽ bị xóa.`}
        onClose={() =>
          setCategoryToDelete(null)
        }
        onConfirm={handleDeleteCategory}
      />

      <ConfirmDialog
        open={pageToDelete !== null}
        title="Xóa Page?"
        description={`Page "${
          pageToDelete?.title ?? ''
        }" và toàn bộ nội dung bên trong sẽ bị xóa.`}
        onClose={() =>
          setPageToDelete(null)
        }
        onConfirm={handleDeletePage}
      />
    </>
  )
}

export default WorkspaceView