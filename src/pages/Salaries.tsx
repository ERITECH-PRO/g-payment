import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSalaries } from '@/hooks/useSalaries';
import { useEmployees } from '@/hooks/useEmployees';
import { API_URL } from '@/config/api';
import {
  MONTHS,
  formatCurrency,
  getCurrentMonthYear,
  getYearOptions
} from '@/lib/constants';
import type { Salary, SalaryFormData } from '@/types/database';
import { Plus, Pencil, Trash2, Loader2, Wallet, FileText, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function Salaries() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState<number | undefined>(currentMonth);

  const { salaries, isLoading, createSalary, updateSalary, deleteSalary } = useSalaries({
    year: filterYear,
    month: filterMonth,
  });
  const { employees } = useEmployees();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [salaryToDelete, setSalaryToDelete] = useState<Salary | null>(null);

  const [formData, setFormData] = useState<SalaryFormData>({
    employee_id: '',
    year: currentYear,
    month: currentMonth,
    salaire: 0,
    prime: 0,
    absence: 0,
    avance: 0,
    date_avance: new Date().toISOString().split('T')[0],
  });

  const resetForm = () => {
    setFormData({
      employee_id: '',
      year: currentYear,
      month: currentMonth,
      salaire: 0,
      prime: 0,
      absence: 0,
      avance: 0,
      date_avance: new Date().toISOString().split('T')[0],
    });
    setSelectedSalary(null);
  };

  const handleOpenDialog = (salary?: Salary) => {
    if (salary) {
      setSelectedSalary(salary);
      setFormData({
        employee_id: salary.employee_id,
        year: salary.year,
        month: salary.month,
        salaire: Number(salary.salaire),
        prime: Number(salary.prime) || 0,
        absence: Number(salary.absence) || 0,
        avance: Number(salary.avance) || 0,
        date_avance: salary.date_avance || new Date().toISOString().split('T')[0],
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    if (selectedSalary) {
      await updateSalary.mutateAsync({ id: selectedSalary.id, ...formData });
    } else {
      await createSalary.mutateAsync(formData);
    }

    handleCloseDialog();
  };

  const handleDelete = async () => {
    if (salaryToDelete) {
      await deleteSalary.mutateAsync(salaryToDelete.id);
      setIsDeleteDialogOpen(false);
      setSalaryToDelete(null);
    }
  };

  const handleGeneratePDF = async (salary: Salary) => {
    // Génération PDF côté client
    toast.info('Génération du bulletin de paie en cours...');

    // On va appeler l'API pour générer le PDF
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_URL}/generate-payslip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ salaryId: salary.id }),
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la génération');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin-${salary.employee?.code}-${salary.year}-${String(salary.month).padStart(2, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Bulletin de paie téléchargé');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const getMonthLabel = (month: number) => {
    return MONTHS.find(m => m.value === month)?.label || '';
  };

  const isSubmitting = createSalary.isPending || updateSalary.isPending;
  const yearOptions = getYearOptions();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestion des Salaires"
        description="Saisissez et gérez les salaires mensuels de vos employés"
        actions={
          <Button onClick={() => handleOpenDialog()} className="shadow-primary">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un salaire
          </Button>
        }
      />

      {/* Filtres */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Label className="text-sm">Année :</Label>
            <Select
              value={String(filterYear)}
              onValueChange={(value) => setFilterYear(Number(value))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Mois :</Label>
            <Select
              value={filterMonth ? String(filterMonth) : 'all'}
              onValueChange={(value) => setFilterMonth(value === 'all' ? undefined : Number(value))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : salaries.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Aucun salaire</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun salaire trouvé pour la période sélectionnée
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Salaire</TableHead>
                <TableHead className="text-right">Prime</TableHead>
                <TableHead className="text-right">Avance</TableHead>
                <TableHead className="text-right">Total Net</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((salary) => {
                const total = Number(salary.salaire) + (Number(salary.prime) || 0);
                return (
                  <TableRow key={salary.id} className="animate-fade-in">
                    <TableCell>
                      <div>
                        <span className="font-mono text-sm text-primary">
                          {salary.employee?.code}
                        </span>
                        <span className="ml-2 font-medium">
                          {salary.employee?.nom} {salary.employee?.prenom}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{salary.year}</TableCell>
                    <TableCell>{getMonthLabel(salary.month)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(salary.salaire))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(salary.prime) || 0)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {Number(salary.avance) > 0 ? `-${formatCurrency(Number(salary.avance))}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(Number(salary.salaire) + (Number(salary.prime) || 0) - (Number(salary.avance) || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleGeneratePDF(salary)}
                          title="Générer le bulletin de paie"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(salary)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSalaryToDelete(salary);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog Ajout/Modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSalary ? 'Modifier le salaire' : 'Ajouter un salaire'}
            </DialogTitle>
            <DialogDescription>
              {selectedSalary
                ? 'Modifiez les informations du salaire'
                : 'Saisissez le salaire mensuel d\'un employé'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employé *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.code} – {emp.nom} {emp.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <Select
                  value={String(formData.year)}
                  onValueChange={(value) => setFormData({ ...formData, year: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Mois *</Label>
                <Select
                  value={String(formData.month)}
                  onValueChange={(value) => setFormData({ ...formData, month: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaire">Salaire (TND) *</Label>
                <Input
                  id="salaire"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salaire}
                  onChange={(e) => setFormData({ ...formData, salaire: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prime">Prime (TND)</Label>
                <Input
                  id="prime"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prime || 0}
                  onChange={(e) => setFormData({ ...formData, prime: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="absence">Absences (jours)</Label>
                <Input
                  id="absence"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.absence || 0}
                  onChange={(e) => setFormData({ ...formData, absence: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avance">Avance (TND)</Label>
                <Input
                  id="avance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.avance || 0}
                  onChange={(e) => setFormData({ ...formData, avance: Number(e.target.value) })}
                />
              </div>
              {(formData.avance || 0) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="date_avance">Date de l'avance</Label>
                  <Input
                    id="date_avance"
                    type="date"
                    value={formData.date_avance || ''}
                    onChange={(e) => setFormData({ ...formData, date_avance: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSalary ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le salaire de{' '}
              <strong>
                {salaryToDelete?.employee?.nom} {salaryToDelete?.employee?.prenom}
              </strong>{' '}
              pour {salaryToDelete && getMonthLabel(salaryToDelete.month)} {salaryToDelete?.year} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
