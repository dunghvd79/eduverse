import React, {useState} from 'react';
import {BookOpen, Clock3, Trophy, CalendarDays, Users, PlayCircle, Plus, Upload, Search, MoreHorizontal, CheckCircle2, AlertCircle, Sparkles, FileSpreadsheet, Download, Filter, Eye, Lock, Server, Database, HardDrive, ShieldCheck, Mail, Save, UserPlus, SlidersHorizontal} from 'lucide-react';
import {PortalHeader,Button,StatCard,Progress,Card,SectionTitle,Table,Badge,Field} from '../../components/portal/PortalUI';

export default function TeacherAssignmentsPage(){return <><PortalHeader eyebrow="ASSIGNMENTS" title="Bài tập" desc="Tạo bài tập, đặt hạn nộp và quản lý file đề." actions={<Button><Plus size={17}/> Tạo bài tập</Button>}/><Card><Table headers={['Bài tập','Lớp','Hạn nộp','Đã nộp','Chưa chấm','Trạng thái']} rows={[
['Assignment 06 — React Router','REACT-A01','05/10/2026 23:59','38/42','24',<Badge tone="orange">Cần chấm</Badge>],
['SQL Query Practice','DB-A02','03/10/2026 23:59','35/38','12',<Badge tone="orange">Cần chấm</Badge>],
['Pandas Mini Project','PY-B01','10/10/2026 23:59','18/31','18',<Badge tone="blue">Đang nhận</Badge>],
['UI Audit','UX-C01','01/10/2026 23:59','24/24','0',<Badge tone="green">Hoàn tất</Badge>]
]}/></Card></>}
