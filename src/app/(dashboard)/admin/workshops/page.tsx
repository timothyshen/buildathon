"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { workshopsService } from "@/services";
import type { Workshop } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PlusCircle, Pencil, Trash2, Play, FileText, GraduationCap, Search, X, Loader2 } from "lucide-react";

export default function AdminWorkshopPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  const handleEdit = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    toast.error(`"${selectedWorkshop?.title}" has been deleted`);
    setIsDeleteDialogOpen(false);
    setSelectedWorkshop(null);
  };

  const saveEdit = () => {
    toast.success(`"${selectedWorkshop?.title}" updated successfully`);
    setIsEditDialogOpen(false);
    setSelectedWorkshop(null);
  };

  return (
    <div className="space-y-6">
      <AdminNav />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/dashboard" },
          { label: "Workshops" }
        ]}
        className="mb-4"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workshop Content</h1>
          <p className="mt-2 text-muted-foreground">
            Manage tutorials, videos, and learning resources
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshops.length}</div>
          </CardContent>
        </Card>
        {categories.slice(0, 3).map((category) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workshops.filter((w) => w.category === category).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Table */}
      {workshops.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Workshops Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create workshops to help participants learn.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Content</CardTitle>
                <CardDescription>
                  {filteredWorkshops.length} of {workshops.length} workshop{workshops.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workshops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
          </CardHeader>
          <CardContent>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Partner</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                    <TableHead className="hidden md:table-cell">Content</TableHead>
                    <TableHead className="hidden md:table-cell">Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkshops.map((workshop) => (
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
                        <Badge variant="outline">{workshop.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {workshop.partnerName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {workshop.duration || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex gap-1">
                          {workshop.videoUrl && (
                            <Badge variant="secondary" className="gap-1">
                              <Play className="h-3 w-3" />
                              Video
                            </Badge>
                          )}
                          {workshop.articleUrl && (
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="h-3 w-3" />
                              Article
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
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
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
            )}
          </CardContent>
        </Card>
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
                <Input id="edit-title" defaultValue={selectedWorkshop.title} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  defaultValue={selectedWorkshop.description}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select defaultValue={selectedWorkshop.category}>
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
                  <Input id="edit-duration" defaultValue={selectedWorkshop.duration || ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-videoUrl">Video URL</Label>
                <Input id="edit-videoUrl" type="url" defaultValue={selectedWorkshop.videoUrl || ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-articleUrl">Article URL</Label>
                <Input id="edit-articleUrl" type="url" defaultValue={selectedWorkshop.articleUrl || ""} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEdit}>
                  Save Changes
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
