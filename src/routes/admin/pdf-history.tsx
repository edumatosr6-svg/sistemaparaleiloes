import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Search, FileText, User, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { format } from 'date-fns';

export const Route = createFileRoute('/admin/pdf-history')({
  component: PdfHistoryAdminPage,
});

function PdfHistoryAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pdfs, isLoading } = useQuery({
    queryKey: ['admin-pdf-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pdfs')
        .select(`
          *,
          profile:profiles(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredPdfs = pdfs?.filter(pdf => 
    pdf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pdf.profile as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <SkeletonPremium className="h-12 w-1/4" />
          <SkeletonPremium className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Histórico de PDFs</h1>
            <p className="text-sm text-slate-500 font-medium">Controle de todos os contratos e notas de venda gerados pelo sistema.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por arquivo ou usuário..." 
              className="pl-10 h-10 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-5">Arquivo / Data</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-5">Tipo</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-5">Usuário</TableHead>
                <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] tracking-widest py-5 px-6">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPdfs?.length ? (
                filteredPdfs.map((pdf) => (
                  <TableRow key={pdf.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <FileText className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{pdf.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{format(new Date(pdf.created_at), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        pdf.type === 'contract' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                        {pdf.type === 'contract' ? 'Contrato' : 'Nota de Venda'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="size-3 text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{(pdf.profile as any)?.full_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary text-slate-400"
                        onClick={() => window.open(pdf.url, '_blank')}
                      >
                        <Download className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <FileText className="size-12 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Nenhum PDF encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
