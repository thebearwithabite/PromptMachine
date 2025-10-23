/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  Baseline,
  Braces,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clipboard,
  FilePenLine,
  FileText,
  FileUp,
  Film,
  Image,
  Info,
  KeyRound,
  Layers,
  Lightbulb,
  MessageSquareText,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Tv,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';

const defaultProps = {
  strokeWidth: 1.5,
};

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <KeyRound {...defaultProps} {...props} />
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <RefreshCw {...defaultProps} {...props} />;

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Sparkles {...defaultProps} {...props} />
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Plus {...defaultProps} {...props} />
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ChevronDown {...defaultProps} {...props} />;

export const SlidersHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <SlidersHorizontal {...defaultProps} {...props} />;

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowRight {...defaultProps} {...props} />;

export const RectangleStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Layers {...defaultProps} {...props} />;

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <X {...defaultProps} {...props} />
);

export const TextModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Baseline {...defaultProps} {...props} />
);

export const FramesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Image {...defaultProps} {...props} />;

export const ReferencesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Film {...defaultProps} {...props} />;

export const TvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Tv {...defaultProps} {...props} />
);

export const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Film {...defaultProps} {...props} />
);

export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Lightbulb {...defaultProps} {...props} />;

export const ClipboardDocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Clipboard {...defaultProps} {...props} />;

export const UploadCloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <UploadCloud {...defaultProps} {...props} />;

export const CheckCircle2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <CheckCircle2 {...defaultProps} {...props} />;

export const FilePenLineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <FilePenLine {...defaultProps} {...props} />;

export const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <FileText {...defaultProps} {...props} />;

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowDownToLine {...defaultProps} {...props} />;

export const FileUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <FileUp {...defaultProps} {...props} />;

export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Clock {...defaultProps} {...props} />
);

export const BracesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Braces {...defaultProps} {...props} />
);

export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Info {...defaultProps} {...props} />
);

export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <XCircle {...defaultProps} {...props} />
);

export const MessageSquareTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <MessageSquareText {...defaultProps} {...props} />;

// This icon had a different stroke width in the original file, so we preserve it.
export const CurvedArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowDown {...props} strokeWidth={3} />;