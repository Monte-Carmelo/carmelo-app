'use client';

import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { LessonTemplate } from '@/lib/api/lessons';

interface LessonSelectorProps {
  lessonType: 'catalog' | 'custom';
  lessonTemplates: LessonTemplate[];
  selectedLessonTemplateId: string;
  customLessonTitle: string;
  lessonTemplateError?: string;
  customLessonTitleError?: string;
  onLessonTypeChange: (type: 'catalog' | 'custom') => void;
  onLessonTemplateChange: (lessonTemplateId: string) => void;
  onCustomLessonTitleChange: (title: string) => void;
}

export function LessonSelector({
  lessonType,
  lessonTemplates,
  selectedLessonTemplateId,
  customLessonTitle,
  lessonTemplateError,
  customLessonTitleError,
  onLessonTypeChange,
  onLessonTemplateChange,
  onCustomLessonTitleChange,
}: LessonSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Tipo de lição</Label>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onLessonTypeChange('catalog')}
            className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent ${
              lessonType === 'catalog' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full border-2 ${
                  lessonType === 'catalog' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {lessonType === 'catalog' && (
                  <div className="h-full w-full rounded-full bg-background p-0.5">
                    <div className="h-full w-full rounded-full bg-primary" />
                  </div>
                )}
              </div>
              <span className="font-semibold">Lição do Catálogo</span>
            </div>
            <p className="text-sm text-muted-foreground">Escolha uma lição pré-cadastrada do sistema</p>
          </button>

          <button
            type="button"
            onClick={() => onLessonTypeChange('custom')}
            className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent ${
              lessonType === 'custom' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full border-2 ${
                  lessonType === 'custom' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {lessonType === 'custom' && (
                  <div className="h-full w-full rounded-full bg-background p-0.5">
                    <div className="h-full w-full rounded-full bg-primary" />
                  </div>
                )}
              </div>
              <span className="font-semibold">Título Personalizado</span>
            </div>
            <p className="text-sm text-muted-foreground">Crie um título específico para esta reunião</p>
          </button>
        </div>
      </div>

      {lessonType === 'catalog' && (
        <div className="space-y-2">
          <Label htmlFor="lessonTemplateId">
            Selecione a lição <span className="text-destructive">*</span>
          </Label>
          <Select value={selectedLessonTemplateId} onValueChange={onLessonTemplateChange}>
            <SelectTrigger id="lessonTemplateId">
              <SelectValue placeholder="Escolha uma lição..." />
            </SelectTrigger>
            <SelectContent>
              {lessonTemplates.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  <div className="flex items-center gap-2">
                    <span>{lesson.title}</span>
                    {lesson.series_name && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {lesson.series_name}
                        {lesson.order_in_series && ` • ${lesson.order_in_series}`}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lessonTemplateError ? <p className="text-sm text-destructive">{lessonTemplateError}</p> : null}
        </div>
      )}

      {lessonType === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="customLessonTitle">
            Título da reunião <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="customLessonTitle"
              type="text"
              className="pl-9"
              value={customLessonTitle}
              onChange={(event) => onCustomLessonTitleChange(event.target.value)}
              placeholder="Ex: Culto especial de Natal, Estudo sobre oração..."
            />
          </div>
          <p className="text-xs text-muted-foreground">Digite um título descritivo para esta reunião</p>
          {customLessonTitleError ? <p className="text-sm text-destructive">{customLessonTitleError}</p> : null}
        </div>
      )}
    </div>
  );
}
