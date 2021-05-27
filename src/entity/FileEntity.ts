import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import {
  Field,
  ID,
  ObjectType,
  registerEnumType,
  InputType,
  // InputType
} from "type-graphql";

import { User } from "./User";
import { Message } from "./Message";

/** Basic Known File Types */
export enum FileTypeEnum {
  CSS = "CSS",
  CSV = "CSV",
  IMAGE = "IMAGE",
  PDF = "PDF",
  SVG = "SVG",
  MD = "MD",
  DOC = "DOC",
  OTHER = "OTHER",
}

registerEnumType(FileTypeEnum, {
  name: "FileTypeEnum", // this one is mandatory
  description: "css | csv | image-all | pdf | svg | docx | other", // this one is optional
});

@ObjectType()
@Entity()
export class FileEntity extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  uri: string;

  @Field(() => FileTypeEnum, { nullable: false })
  @Column({
    type: "enum",
    enum: FileTypeEnum,
    default: FileTypeEnum.OTHER,
  })
  file_type: FileTypeEnum;

  @Field(() => Message, { nullable: true })
  @ManyToOne(() => Message, (message) => message.files, {
    nullable: true,
    onDelete: "CASCADE",
  })
  message?: Message;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
  upload_user: User;
}

@InputType()
export class FileInputHelper {
  @Field()
  @Column()
  uri: string;

  // @Field()
  // @Column()
  // type: string;

  // @Field()
  // @Column()
  // lastModified: string;

  // @Field()
  // @Column()
  // lastModifiedDate: Date;

  // @Field()
  // @Column()
  // name: string;

  // @Field()
  // @Column()
  // path: string;

  // @Field()
  // @Column()
  // webkitRelativePath: string;

  // @Field()
  // @Column()
  // size: number;

  @Field(() => FileTypeEnum, { nullable: false })
  @Column({
    type: "enum",
    enum: FileTypeEnum,
    default: FileTypeEnum.OTHER,
  })
  file_type: FileTypeEnum;
}
