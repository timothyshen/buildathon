"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { workshopsService } from "@/services";
import type { Workshop } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { PlusCircle, Pencil, Trash2, GraduationCap, Search, X, Loader2 } from "lucide-react";

export default function AdminWorkshopPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    async function loadData() {
      const { data, success } = await workshopsService.list();
      if (success) setWorkshops(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = Array.from(new Set(workshops.map((w) => w.category)));

  // Filter workshops based on search and category
  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch =
      searchQuery === "" ||
      workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.partnerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || workshop.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const paginatedWorkshops = filteredWorkshops.slice((page - 1) * pageSize, page * pageSize);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPage(1);
  };

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editArticleUrl, setEditArticleUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setEditTitle(workshop.title);
    setEditDescription(workshop.description);
    setEditCategory(workshop.category);
    setEditDuration(workshop.duration || "");
    setEditVideoUrl(workshop.videoUrl || "");
    setEditArticleUrl(workshop.articleUrl || "");
    setIsEditDialogOpen(true);
  };

  const handleDelete = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedWorkshop) return;
    setIsDeleting(true);
    const result = await workshopsService.delete(selectedWorkshop.id);
    if (result.success) {
      setWorkshops(prev => prev.filter(w => w.id !== selectedWorkshop.id));
      toast.success(`"${selectedWorkshop.title}" has been deleted`);
    } else {
      toast.error(result.error || "Failed to delete workshop");
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setSelectedWorkshop(null);
  };

  const saveEdit = async () => {
    if (!selectedWorkshop) return;
    setIsSaving(true);
    const result = await workshopsService.update(selectedWorkshop.id, {
      title: editTitle,
      description: editDescription,
      category: editCategory,
      duration: editDuration || undefined,
      videoUrl: editVideoUrl || undefined,
      articleUrl: editArticleUrl || undefined,
    });
    if (result.success) {
      setWorkshops(prev => prev.map(w => w.id === selectedWorkshop.id ? result.data : w));
      toast.success(`"${editTitle}" updated successfully`);
    } else {
      toast.error(result.error || "Failed to update workshop");
    }
    setIsSaving(false);
    setIsEditDialogOpen(false);
    setSelectedWorkshop(null);
  };

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Workshops" }
        ]}
      />
      <AdminNav />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resource Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage learning resources, tutorials, and guides
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Workshop Content</DialogTitle>
              <DialogDescription>
                Create a new tutorial or learning resource
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Workshop title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What will learners gain from this content?"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basics">Basics</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" placeholder="e.g., 30 min" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input id="videoUrl" type="url" placeholder="https://youtube.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="articleUrl">Article URL</Label>
                <Input id="articleUrl" type="url" placeholder="https://docs..." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partnerName">Partner Name</Label>
                  <Input id="partnerName" placeholder="Story Foundation" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerLogo">Partner Logo URL</Label>
                  <Input id="partnerLogo" type="url" placeholder="https://..." />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Add Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Strip */}
      <div className="flex rounded-xl border divide-x">
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Total Content</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{workshops.length}</p>
        </div>
        {categories.slice(0, 3).map((category) => (
          <div key={category} className="flex-1 px-6 py-4">
            <p className="text-sm text-muted-foreground">{category}</p>
            <p className="text-3xl font-mono font-semibold tabular-nums mt-1">
              {workshops.filter((w) => w.category === category).length}
            </p>
          </div>
        ))}
      </div>

      {/* Content Table */}
      {workshops.length === 0 ? (
        <div className="py-12 text-center">
          <GraduationCap className="mx-auto h-8 w-8 opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">No Workshops Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create workshops to help participants learn.
          </p>
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search workshops..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || categoryFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {filteredWorkshops.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No results found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[300px]">Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWorkshops.map((workshop) => (
                      <TableRow key={workshop.id}>
                        <TableCell>
                          <div className="max-w-[280px]">
                            <p className="font-medium truncate">{workshop.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {workshop.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{workshop.category}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {workshop.partnerName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {workshop.duration || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {[
                              workshop.videoUrl ? "Video" : null,
                              workshop.articleUrl ? "Article" : null,
                            ]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {workshop.publishedAt
                            ? new Date(workshop.publishedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(workshop)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(workshop)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={filteredWorkshops.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>
              Update the workshop content details
            </DialogDescription>
          </DialogHeader>
          {selectedWorkshop && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basics">Basics</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input id="edit-duration" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-videoUrl">Video URL</Label>
                <Input id="edit-videoUrl" type="url" value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-articleUrl">Article URL</Label>
                <Input id="edit-articleUrl" type="url" value={editArticleUrl} onChange={(e) => setEditArticleUrl(e.target.value)} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{selectedWorkshop?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
