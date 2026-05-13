"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  isValidAvatarMimeType,
  MAX_AVATAR_FILE_SIZE,
  validateAvatarFile,
} from "@/lib/profile/avatar"

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  userInitials: string
  onUploadSuccess: () => void
}

export function AvatarUpload({
  currentAvatarUrl,
  userInitials,
  onUploadSuccess,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    setSuccessMessage(null)

    const validationError = validateAvatarFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Không thể tải ảnh đại diện lên.")
        return
      }

      setSuccessMessage("Ảnh đại diện được cập nhật thành công!")
      setPreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Wait a bit then refresh
      setTimeout(() => {
        onUploadSuccess()
      }, 1500)
    } catch (error) {
      setError("Lỗi kết nối. Vui lòng thử lại sau.")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!currentAvatarUrl) return

    setIsDeleting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/users/me/avatar", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Không thể xóa ảnh đại diện.")
        return
      }

      setSuccessMessage("Ảnh đại diện được xóa thành công!")
      setPreview(null)
      setSelectedFile(null)

      // Wait a bit then refresh
      setTimeout(() => {
        onUploadSuccess()
      }, 1500)
    } catch (error) {
      setError("Lỗi kết nối. Vui lòng thử lại sau.")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {successMessage}
        </div>
      )}

      {/* Current Avatar or Preview */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <div>
          {preview ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <Avatar
              src={currentAvatarUrl || undefined}
              initials={userInitials}
              size="xl"
            />
          )}
        </div>
        <div className="text-center">
          {preview ? (
            <p className="text-sm text-slate-600">Xem trước ảnh mới</p>
          ) : (
            <p className="text-sm text-slate-600">
              {currentAvatarUrl ? "Ảnh đại diện hiện tại" : "Chưa có ảnh đại diện"}
            </p>
          )}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-colors ${
          isDragActive
            ? "border-teal-500 bg-teal-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <div className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={".png,.jpg,.jpeg,.gif"}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading || isDeleting}
          />

          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-14-12l6 6m-6-6v12"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div>
              <p className="text-sm font-medium text-slate-900">
                Kéo thả ảnh hoặc{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isDeleting}
                  className="text-teal-600 hover:text-teal-700 underline disabled:opacity-50"
                >
                  chọn file
                </button>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                PNG, JPG, GIF - Tối đa 2MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Tệp được chọn</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                <span className="font-medium">Tên:</span> {selectedFile.name}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Kích thước:</span>{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Loại:</span> {selectedFile.type}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">Đang tải lên</p>
            <p className="text-sm text-slate-600">{uploadProgress}%</p>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {preview ? (
          <>
            <Button
              onClick={handleUpload}
              disabled={isUploading || isDeleting}
              className="flex-1"
            >
              {isUploading ? "Đang tải lên..." : "Cập nhật ảnh đại diện"}
            </Button>
            <Button
              onClick={clearPreview}
              variant="outline"
              disabled={isUploading || isDeleting}
            >
              Hủy
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
              className="flex-1"
            >
              Chọn ảnh
            </Button>
            {currentAvatarUrl && (
              <Button
                onClick={handleDelete}
                variant="outline"
                disabled={isUploading || isDeleting}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isDeleting ? "Đang xóa..." : "Xóa ảnh"}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-slate-500">
        Ảnh đại diện của bạn sẽ được hiển thị trên toàn bộ ứng dụng. Thay đổi có hiệu lực ngay lập tức.
      </p>
    </div>
  )
}
